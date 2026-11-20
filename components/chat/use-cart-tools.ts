'use client';

import type { ChatOnToolCallCallback } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { buildCartLine } from '@/lib/chat/catalog';
import { snapshotCart } from '@/lib/chat/cart-snapshot';
import type { ChatUIMessage } from '@/lib/chat/tools';
import { mergeCartLine } from '@/lib/store-logic';
import type { CartItem } from '@/lib/types';

type AddToolOutput = UseChatHelpers<ChatUIMessage>['addToolOutput'];

export function useCartToolRunner(): (
  toolCall: Parameters<ChatOnToolCallCallback<ChatUIMessage>>[0]['toolCall'],
  addToolOutput: AddToolOutput
) => void {
  const {
    products,
    coupons,
    settings,
    cart,
    couponCode,
    addToCart,
    updateCartQty,
    removeFromCart,
    applyCoupon,
  } = useStore();

  // State updates are async, so two tool calls in one step must see each other's changes: mirror in a ref.
  const cartRef = useRef<CartItem[]>(cart);
  const couponRef = useRef<string | null>(couponCode);
  useEffect(() => {
    cartRef.current = cart;
    couponRef.current = couponCode;
  }, [cart, couponCode]);

  return useCallback(
    (toolCall, addToolOutput) => {
      if (toolCall.dynamic) return;
      const id = toolCall.toolCallId;
      const snap = () =>
        snapshotCart(
          cartRef.current,
          couponRef.current,
          coupons,
          settings.freeShippingThreshold,
          settings.standardShippingFee
        );

      try {
        switch (toolCall.toolName) {
          case 'addToCart': {
            const built = buildCartLine(toolCall.input, products);
            if (!built.ok) {
              addToolOutput({
                tool: 'addToCart',
                toolCallId: id,
                output: { ok: false, reason: built.reason },
              });
              return;
            }
            addToCart(built.line, false);
            cartRef.current = mergeCartLine(cartRef.current, built.line);
            addToolOutput({
              tool: 'addToCart',
              toolCallId: id,
              output: { ok: true, addedName: built.line.name, cart: snap() },
            });
            return;
          }
          case 'updateCartItem': {
            const { lineId, quantity } = toolCall.input;
            if (!cartRef.current.some((c) => c.id === lineId)) {
              addToolOutput({
                tool: 'updateCartItem',
                toolCallId: id,
                output: { ok: false, reason: 'That item is not in the cart.' },
              });
              return;
            }
            if (quantity === 0) {
              removeFromCart(lineId);
              cartRef.current = cartRef.current.filter((c) => c.id !== lineId);
            } else {
              updateCartQty(lineId, quantity);
              cartRef.current = cartRef.current.map((c) =>
                c.id === lineId ? { ...c, quantity } : c
              );
            }
            addToolOutput({
              tool: 'updateCartItem',
              toolCallId: id,
              output: { ok: true, cart: snap() },
            });
            return;
          }
          case 'viewCart':
            addToolOutput({ tool: 'viewCart', toolCallId: id, output: snap() });
            return;
          case 'applyCoupon': {
            const r = applyCoupon(toolCall.input.code);
            if (r.valid) couponRef.current = toolCall.input.code.trim().toUpperCase();
            addToolOutput({
              tool: 'applyCoupon',
              toolCallId: id,
              output: { valid: r.valid, message: r.message, cart: snap() },
            });
            return;
          }
          case 'startCheckout': {
            const cartNow = snap();
            addToolOutput({
              tool: 'startCheckout',
              toolCallId: id,
              output: {
                ready: cartNow.itemCount > 0,
                reason: cartNow.itemCount > 0 ? undefined : 'Your cart is empty.',
                needsPrescription: cartNow.hasRx,
                cart: cartNow,
              },
            });
            return;
          }
        }
      } catch {
        addToolOutput({
          tool: toolCall.toolName as 'viewCart',
          toolCallId: id,
          state: 'output-error',
          errorText: 'Cart action failed.',
        });
      }
    },
    [
      products,
      coupons,
      settings.freeShippingThreshold,
      settings.standardShippingFee,
      addToCart,
      updateCartQty,
      removeFromCart,
      applyCoupon,
    ]
  );
}
