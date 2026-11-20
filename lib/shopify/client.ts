import fs from 'node:fs';
import path from 'node:path';

let localEnvCache: Record<string, string> | null = null;
function getServerEnv(key: string): string | undefined {
  if (process.env.NODE_ENV !== 'production' && !localEnvCache) {
    try {
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        const parsed: Record<string, string> = {};
        for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
          const line = rawLine.trim();
          if (!line || line.startsWith('#')) continue;
          const idx = line.indexOf('=');
          if (idx === -1) continue;
          parsed[line.slice(0, idx).trim()] = line
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
        }
        localEnvCache = parsed;
      } else {
        localEnvCache = {};
      }
    } catch {
      localEnvCache = {};
    }
  }
  return localEnvCache?.[key]?.trim() || process.env[key]?.trim();
}

export function getShopifyConfig() {
  const domain = getServerEnv('SHOPIFY_STORE_DOMAIN');
  const adminToken = getServerEnv('SHOPIFY_ADMIN_API_ACCESS_TOKEN');
  const storefrontToken = getServerEnv('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
  const clientId = getServerEnv('SHOPIFY_CLIENT_ID');
  const clientSecret = getServerEnv('SHOPIFY_CLIENT_SECRET');
  const apiVersion = getServerEnv('SHOPIFY_API_VERSION') || '2024-10';
  return {
    domain,
    adminToken,
    storefrontToken,
    clientId,
    clientSecret,
    apiVersion,
    isConfigured: Boolean(domain && (storefrontToken || adminToken || (clientId && clientSecret))),
  };
}

let cachedAdminToken: { token: string; expiresAt: number } | null = null;

async function fetchClientCredentialsToken(domain: string, clientId: string, clientSecret: string) {
  const res = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Shopify OAuth token error (${res.status})`);
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error('Missing access_token from Shopify OAuth');
  }
  const ttlMs = Math.max(60, (data.expires_in ?? 86399) - 120) * 1000;
  cachedAdminToken = { token: data.access_token, expiresAt: Date.now() + ttlMs };
  return data.access_token;
}

async function resolveAdminToken(forceRefresh = false): Promise<string> {
  const { domain, adminToken, clientId, clientSecret } = getShopifyConfig();
  if (!domain) throw new Error('Missing SHOPIFY_STORE_DOMAIN');

  if (!forceRefresh && cachedAdminToken && Date.now() < cachedAdminToken.expiresAt) {
    return cachedAdminToken.token;
  }

  if (clientId && clientSecret && (forceRefresh || !adminToken)) {
    return fetchClientCredentialsToken(domain, clientId, clientSecret);
  }

  if (adminToken) {
    return adminToken;
  }

  if (clientId && clientSecret) {
    return fetchClientCredentialsToken(domain, clientId, clientSecret);
  }

  throw new Error('Missing Shopify Admin credentials');
}

interface QueryOptions {
  revalidate?: number | false;
  tags?: string[];
  cache?: RequestCache;
}

export async function shopifyStorefrontQuery<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
  options: QueryOptions = {}
): Promise<T> {
  const { domain, storefrontToken, apiVersion } = getShopifyConfig();
  if (!domain || !storefrontToken) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN');
  }

  const endpoint = `https://${domain}/api/${apiVersion}/graphql.json`;
  const fetchInit: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  };

  if (options.cache) {
    fetchInit.cache = options.cache;
  } else {
    fetchInit.next = {
      revalidate: options.revalidate ?? 30,
      tags: options.tags ?? ['shopify'],
    };
  }

  const res = await fetch(endpoint, fetchInit);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!res.ok || json.errors?.length || !json.data) {
    throw new Error(
      `Shopify Storefront GraphQL error (${res.status}): ${JSON.stringify(json.errors ?? json)}`
    );
  }
  return json.data;
}

export async function shopifyAdminQuery<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {},
  options: QueryOptions = {}
): Promise<T> {
  const { domain, apiVersion, clientId, clientSecret } = getShopifyConfig();
  if (!domain) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN');
  }

  const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;

  const runFetch = async (token: string) => {
    const fetchInit: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query, variables }),
    };

    if (options.cache) {
      fetchInit.cache = options.cache;
    } else {
      fetchInit.next = {
        revalidate: options.revalidate ?? 30,
        tags: options.tags ?? ['shopify'],
      };
    }

    return fetch(endpoint, fetchInit);
  };

  let token = await resolveAdminToken(false);
  let res = await runFetch(token);

  if (res.status === 401 && clientId && clientSecret) {
    token = await resolveAdminToken(true);
    res = await runFetch(token);
  }

  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!res.ok || json.errors?.length || !json.data) {
    throw new Error(
      `Shopify Admin GraphQL error (${res.status}): ${JSON.stringify(json.errors ?? json)}`
    );
  }
  return json.data;
}
