import {
  convertToModelMessages,
  createGateway,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  pruneMessages,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type ModelMessage,
  type TextStreamPart,
} from 'ai';
import { routeFast } from '@/lib/chat/fastpath';
import { clientKey, rateLimit } from '@/lib/chat/limits';
import { SYSTEM_PROMPT } from '@/lib/chat/prompt';
import { sanitizeMessages } from '@/lib/chat/sanitize';
import { tools, type ChatUIMessage } from '@/lib/chat/tools';

export const maxDuration = 30;

// "creator/model" slugs are routed by Vercel AI Gateway.
const PRIMARY = process.env.CHAT_MODEL ?? 'nvidia/nemotron-3.5-lightning-free';
const FALLBACKS = (
  process.env.CHAT_MODEL_FALLBACKS ??
  'google/gemini-2.5-flash-lite,google/gemini-2.5-flash,openai/gpt-4o-mini'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_HISTORY = 12;

function getGatewayModel(modelId: string) {
  const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_GATEWAY;
  if (apiKey) {
    const gatewayProvider = createGateway({ apiKey });
    return gatewayProvider(modelId);
  }
  return modelId;
}

function cannedResponse(text: string) {
  const id = crypto.randomUUID();
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: 'start' });
        writer.write({ type: 'text-start', id });
        writer.write({ type: 'text-delta', id, delta: text });
        writer.write({ type: 'text-end', id });
        writer.write({ type: 'finish' });
      },
    }),
  });
}

export async function POST(req: Request) {
  if (!rateLimit(clientKey(req))) {
    return Response.json(
      { error: 'Too many messages. Please wait a moment.' },
      { status: 429 }
    );
  }

  // 1. Validate shape, then allow-list content. The browser owns the history, so it is untrusted.
  let messages: ChatUIMessage[];
  try {
    const body = await req.json();
    const validated = await validateUIMessages<ChatUIMessage>({
      messages: body.messages,
      tools,
    });
    const clean = sanitizeMessages(validated);
    if (!clean) throw new Error('too long');
    messages = clean.slice(-MAX_HISTORY);
    if (!messages.length) throw new Error('empty');
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const last = messages.at(-1);
  const lastText =
    last?.role === 'user'
      ? last.parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text)
          .join(' ')
      : '';

  // 2. Fast path: emergencies, greetings, exact FAQ hits. No model call at all.
  if (lastText) {
    const fast = routeFast(lastText);
    if (fast) return cannedResponse(fast.text);
  }

  // 3. Model path. Pass the SAME tools to convertToModelMessages so toModelOutput slims old tool results.
  const modelMessages = pruneMessages({
    messages: await convertToModelMessages(messages, { tools }),
    reasoning: 'all',
    toolCalls: 'before-last-4-messages',
    emptyMessages: 'remove',
  });

  const sessionId = req.headers.get('x-session-id')?.slice(0, 64) ?? undefined;

  const history: ModelMessage[] = [...modelMessages];
  let stepsCompleted = 0;

  const launchModel = (
    modelId: string,
    fallbackModels: string[],
    stepMessages: ModelMessage[],
    maxSteps: number,
    firstChunkMs: number
  ) =>
    streamText({
      model: getGatewayModel(modelId),
      instructions: SYSTEM_PROMPT,
      messages: stepMessages,
      tools,
      stopWhen: isStepCount(maxSteps),
      maxOutputTokens: 1200,
      temperature: 0.2,
      timeout: { totalMs: 28_000, firstChunkMs, chunkMs: 12_000 },
      abortSignal: req.signal,
      providerOptions: {
        gateway: {
          models: fallbackModels,
          caching: 'auto',
          user: sessionId,
          tags: [
            'app:xmedcar',
            'feature:shop-assistant',
            `env:${process.env.VERCEL_ENV ?? 'dev'}`,
          ],
        },
      },
      onStepEnd: ({ response }) => {
        history.push(...response.messages);
        stepsCompleted += 1;
      },
      onEnd: ({ usage, finishReason }) => {
        console.log(
          JSON.stringify({
            evt: 'chat_turn',
            model: modelId,
            finishReason,
            in: usage.inputTokens,
            out: usage.outputTokens,
            cachedIn: usage.inputTokenDetails?.cacheReadTokens,
          })
        );
      },
    });

  // Buffer step-start / reasoning parts within each step until visible output (tool or text) starts,
  // so if the primary free model stalls or errors on a step we can seamlessly continue on a fallback model.
  const resilientStream = new ReadableStream<TextStreamPart<typeof tools>>({
    async start(controller) {
      let emittedStart = false;
      let stepCommitted = false;
      let stepBuffer: TextStreamPart<typeof tools>[] = [];

      const flushBuffer = () => {
        for (const buffered of stepBuffer) controller.enqueue(buffered);
        stepBuffer = [];
        stepCommitted = true;
      };

      const primary = launchModel(PRIMARY, FALLBACKS, history, 4, 10_000);
      const reader = primary.stream.getReader();
      let needFallback = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value.type === 'start') {
            if (!emittedStart) {
              controller.enqueue(value);
              emittedStart = true;
            }
            continue;
          }

          if (
            (value.type === 'abort' || value.type === 'error') &&
            !stepCommitted &&
            !req.signal.aborted &&
            FALLBACKS.length > 0
          ) {
            needFallback = true;
            await reader.cancel().catch(() => {});
            break;
          }

          if (!stepCommitted) {
            if (value.type === 'start-step') {
              stepBuffer = [value];
              continue;
            }
            if (
              value.type === 'reasoning-start' ||
              value.type === 'reasoning-delta' ||
              value.type === 'reasoning-end'
            ) {
              stepBuffer.push(value);
              continue;
            }
            if (
              value.type === 'tool-input-start' ||
              value.type === 'text-start' ||
              value.type === 'tool-call' ||
              value.type === 'finish-step' ||
              value.type === 'finish'
            ) {
              flushBuffer();
            }
          }

          controller.enqueue(value);

          if (value.type === 'finish-step') {
            stepCommitted = false;
            stepBuffer = [];
          }
        }

        if (needFallback) {
          console.warn(
            `[api/chat] ${PRIMARY} stalled/errored before step output; switching to ${FALLBACKS[0]}`
          );
          const remainingSteps = Math.max(1, 4 - stepsCompleted);
          const fallback = launchModel(
            FALLBACKS[0],
            FALLBACKS.slice(1),
            history,
            remainingSteps,
            15_000
          );
          const fbReader = fallback.stream.getReader();
          while (true) {
            const { done, value } = await fbReader.read();
            if (done) break;
            if (value.type === 'start' && emittedStart) continue;
            if (value.type === 'start') emittedStart = true;
            controller.enqueue(value);
          }
        }

        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: resilientStream,
      originalMessages: messages,
      onError: (err) => {
        console.error('[api/chat] stream error:', err);
        const msg = err instanceof Error ? err.message : String(err ?? '');
        if (/credit card|customer_verification_required/i.test(msg)) {
          return 'Vercel AI Gateway requires a credit card on file for this API key before live AI replies can run.';
        }
        if (/free tier|no_providers_available|RestrictedModelsError/i.test(msg)) {
          return 'The selected AI model is unavailable on this Gateway account.';
        }
        if (/rate limit|too many requests|429/i.test(msg)) {
          return 'AI service is temporarily busy. Please try again in a moment.';
        }
        if (/timeout|timed out|aborted/i.test(msg)) {
          return 'The assistant took too long to respond. Please retry.';
        }
        return 'Sorry, something went wrong. Please try again.';
      },
    }),
  });
}
