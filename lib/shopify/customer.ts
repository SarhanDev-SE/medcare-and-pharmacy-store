import crypto from 'node:crypto';
import type {
  MedicineSubscription,
  Order,
  OrderStatus,
  PrescriptionFileMeta,
  PrescriptionRequest,
  Product,
  UserProfile,
} from '@/lib/types';
import { getShopifyConfig, shopifyAdminQuery, shopifyStorefrontQuery } from './client';

export const SESSION_COOKIE_NAME = 'xmedcar_session';
export const CART_COOKIE_NAME = 'xmedcar_cart_id';

export interface SessionPayload {
  customerId: string;
  email: string;
  exp: number;
}

export interface RawAdminOrderNode {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  statusPageUrl?: string | null;
  note?: string | null;
  tags?: string[];
  subtotalPriceSet?: { shopMoney?: { amount: string; currencyCode: string } } | null;
  totalShippingPriceSet?: { shopMoney?: { amount: string; currencyCode: string } } | null;
  totalDiscountsSet?: { shopMoney?: { amount: string; currencyCode: string } } | null;
  totalPriceSet?: { shopMoney?: { amount: string; currencyCode: string } } | null;
  shippingAddress?: {
    firstName?: string | null;
    lastName?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    zip?: string | null;
    country?: string | null;
    phone?: string | null;
  } | null;
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  customAttributes?: Array<{ key: string; value?: string | null }>;
  lineItems: {
    nodes: Array<{
      title: string;
      quantity: number;
      originalUnitPriceSet?: { shopMoney?: { amount: string } } | null;
      variant?: {
        id: string;
        title: string;
        image?: { url: string } | null;
        product?: {
          id: string;
          handle: string;
          images?: { nodes: Array<{ url: string }> };
        } | null;
      } | null;
    }>;
  };
}

export interface RawAdminCustomerNode {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  defaultAddress?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    zip?: string | null;
    country?: string | null;
    phone?: string | null;
  } | null;
  metafields?: {
    nodes: Array<{ namespace: string; key: string; value: string }>;
  };
  orders?: {
    nodes: RawAdminOrderNode[];
  };
}

export interface CustomerAccountSnapshot {
  user: UserProfile;
  orders: Order[];
  wishlistIds: string[];
  recentlyViewedIds: string[];
  rxRequests: PrescriptionRequest[];
  subscriptions: MedicineSubscription[];
}

function getSigningSecret(): string {
  const { clientSecret, storefrontToken } = getShopifyConfig();
  return clientSecret || storefrontToken || 'xmedcar-local-session-secret';
}

export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSigningSecret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  if (!data || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', getSigningSecret()).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.customerId || !parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hashCustomerPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyCustomerPassword(password: string, storedHash: string | undefined): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, hex] = parts;
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hex, 'hex');
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function parseMetafieldJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function mapAdminOrderStatus(node: RawAdminOrderNode): OrderStatus {
  if (node.cancelledAt) return 'Cancelled';
  const fin = (node.displayFinancialStatus || '').toUpperCase();
  const ful = (node.displayFulfillmentStatus || '').toUpperCase();
  if (ful === 'FULFILLED') return 'Completed';
  if (fin === 'PENDING' || fin === 'AUTHORIZED') return 'Pending payment';
  return 'Processing';
}

export function mapAdminOrderToStoreOrder(
  node: RawAdminOrderNode,
  catalog: Product[] = []
): Order {
  const addr = node.shippingAddress;
  const formattedAddress = addr
    ? [addr.address1, addr.address2, addr.city, `${addr.province ?? ''} ${addr.zip ?? ''}`.trim(), addr.country]
        .filter(Boolean)
        .join(', ')
    : 'Karachi, Pakistan';

  const billingName =
    [node.customer?.firstName || addr?.firstName, node.customer?.lastName || addr?.lastName]
      .filter(Boolean)
      .join(' ') || 'Xmedcar Customer';

  const noteMatch = node.note?.match(/Payment Method:\s*([^|]+)/i);
  const rxMatch = node.note?.match(/Prescription Document:\s*([^|]+)/i);
  const emailAttr = node.customAttributes?.find((a) => a.key === 'customer_email')?.value;
  const rxUrlAttr = node.customAttributes?.find((a) => a.key === 'rx_document_url')?.value;
  const rxNameAttr = node.customAttributes?.find((a) => a.key === 'rx_document_name')?.value;

  const isRxOrder = Boolean(
    node.tags?.some((t) => /rx/i.test(t)) || rxMatch || rxNameAttr
  );

  const items = node.lineItems.nodes.map((li) => {
    const prodHandle = li.variant?.product?.handle;
    const matched = catalog.find(
      (p) => p.slug === prodHandle || p.name.toLowerCase() === li.title.toLowerCase()
    );
    const rawVariantTitle = li.variant?.title;
    return {
      productId: matched?.id ?? li.variant?.product?.id ?? li.title,
      name: matched?.name ?? li.title,
      quantity: li.quantity,
      price: Math.round(parseFloat(li.originalUnitPriceSet?.shopMoney?.amount || '0')),
      image:
        li.variant?.image?.url ||
        li.variant?.product?.images?.nodes?.[0]?.url ||
        matched?.image ||
        '/images/products/gaia-relax-gummies.png',
      isRx: matched?.isRx ?? isRxOrder,
      variantLabel:
        rawVariantTitle && rawVariantTitle !== 'Default Title' ? rawVariantTitle : undefined,
      purchaseMode: 'one-time' as const,
    };
  });

  const formattedDate = new Date(node.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const total = Math.round(parseFloat(node.totalPriceSet?.shopMoney?.amount || '0'));
  const subtotal = Math.round(parseFloat(node.subtotalPriceSet?.shopMoney?.amount || String(total)));
  const shipping = Math.round(parseFloat(node.totalShippingPriceSet?.shopMoney?.amount || '0'));
  const discount = Math.round(parseFloat(node.totalDiscountsSet?.shopMoney?.amount || '0'));

  return {
    id: node.id,
    shopifyOrderId: node.id,
    shopifyOrderUrl: node.statusPageUrl ?? undefined,
    number: node.name,
    date: formattedDate,
    status: mapAdminOrderStatus(node),
    total,
    subtotal,
    discount,
    shipping,
    paymentMethod: noteMatch?.[1]?.trim() || 'Direct bank transfer',
    items,
    billingName,
    billingEmail: emailAttr || node.email || node.customer?.email || 'customer.xmedcar@gmail.com',
    billingPhone: node.phone || node.customer?.phone || addr?.phone || '+92 300 8451290',
    shippingAddress: formattedAddress,
    ...(rxMatch || rxNameAttr
      ? {
          prescriptionFile: {
            name: (rxNameAttr || rxMatch?.[1] || 'prescription.png').trim(),
            size: 102400,
            type: 'image/png',
            uploadedAt: formattedDate,
            ...(rxUrlAttr ? { previewDataUrl: rxUrlAttr } : {}),
          },
        }
      : {}),
    orderNotes: node.note ?? undefined,
  };
}

export function mapAdminCustomerToProfile(node: RawAdminCustomerNode): UserProfile {
  const addr = node.defaultAddress;
  const fullName = [node.firstName, node.lastName].filter(Boolean).join(' ').trim() || node.email?.split('@')[0] || 'Customer';
  return {
    id: node.id,
    name: fullName,
    email: node.email || '',
    phone: node.phone || addr?.phone || '+92 300 8451290',
    billingAddress: {
      firstName: addr?.firstName || node.firstName || fullName.split(' ')[0] || 'Tariq',
      lastName: addr?.lastName || node.lastName || fullName.split(' ').slice(1).join(' ') || 'Mahmood',
      country: addr?.country || 'Pakistan',
      street1: addr?.address1 || 'House 24-B, Khayaban-e-Ittehad, DHA Phase 6',
      street2: addr?.address2 || 'Clifton Block 5',
      city: addr?.city || 'Karachi',
      state: addr?.province || 'Sindh',
      zip: addr?.zip || '75600',
      phone: addr?.phone || node.phone || '+92 300 8451290',
      email: node.email || '',
    },
  };
}

const CUSTOMER_FIELDS_FRAGMENT = `
  id
  firstName
  lastName
  email
  phone
  defaultAddress {
    id firstName lastName address1 address2 city province zip country phone
  }
  metafields(first: 20, namespace: "xmedcar") {
    nodes { namespace key value }
  }
  orders(first: 25, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id name email phone createdAt cancelledAt
      displayFinancialStatus displayFulfillmentStatus statusPageUrl
      note tags
      customAttributes { key value }
      subtotalPriceSet { shopMoney { amount currencyCode } }
      totalShippingPriceSet { shopMoney { amount currencyCode } }
      totalDiscountsSet { shopMoney { amount currencyCode } }
      totalPriceSet { shopMoney { amount currencyCode } }
      shippingAddress {
        firstName lastName address1 address2 city province zip country phone
      }
      customer { id firstName lastName email phone }
      lineItems(first: 20) {
        nodes {
          title quantity
          originalUnitPriceSet { shopMoney { amount } }
          variant {
            id title image { url }
            product { id handle images(first: 1) { nodes { url } } }
          }
        }
      }
    }
  }
`;

export async function fetchAdminCustomerById(customerId: string): Promise<RawAdminCustomerNode | null> {
  const res = await shopifyAdminQuery<{ customer: RawAdminCustomerNode | null }>(
    `query($id: ID!) {
      customer(id: $id) {
        ${CUSTOMER_FIELDS_FRAGMENT}
      }
    }`,
    { id: customerId },
    { cache: 'no-store' }
  );
  return res.customer;
}

export async function findAdminCustomerByIdentifier(
  identifier: string
): Promise<RawAdminCustomerNode | null> {
  const clean = identifier.trim().toLowerCase();
  if (!clean) return null;

  const queryTerm = clean.includes('@') ? `email:${clean}` : clean;
  const res = await shopifyAdminQuery<{ customers: { nodes: RawAdminCustomerNode[] } }>(
    `query($q: String!) {
      customers(first: 5, query: $q) {
        nodes {
          ${CUSTOMER_FIELDS_FRAGMENT}
        }
      }
    }`,
    { q: queryTerm },
    { cache: 'no-store' }
  );

  const exact = res.customers.nodes.find((c) => {
    const emailMatch = c.email?.toLowerCase() === clean;
    const usernameMf = c.metafields?.nodes.find((m) => m.key === 'username')?.value?.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
    return emailMatch || usernameMf === clean || fullName === clean;
  });

  if (exact) return exact;

  // Fallback: check username metafield across recent customers if non-email login
  if (!clean.includes('@')) {
    const allRes = await shopifyAdminQuery<{ customers: { nodes: RawAdminCustomerNode[] } }>(
      `query {
        customers(first: 25) {
          nodes {
            ${CUSTOMER_FIELDS_FRAGMENT}
          }
        }
      }`,
      {},
      { cache: 'no-store' }
    );
    return (
      allRes.customers.nodes.find((c) => {
        const usernameMf = c.metafields?.nodes.find((m) => m.key === 'username')?.value?.toLowerCase();
        const emailPrefix = c.email?.split('@')[0]?.toLowerCase();
        return usernameMf === clean || emailPrefix === clean;
      }) ?? null
    );
  }

  return null;
}

export function buildCustomerAccountSnapshot(
  node: RawAdminCustomerNode,
  catalog: Product[] = []
): CustomerAccountSnapshot {
  const mfMap = new Map((node.metafields?.nodes ?? []).map((m) => [m.key, m.value]));
  const user = mapAdminCustomerToProfile(node);
  const orders = (node.orders?.nodes ?? []).map((o) => mapAdminOrderToStoreOrder(o, catalog));
  const wishlistIds = parseMetafieldJson<string[]>(mfMap.get('wishlist_ids'), []);
  const recentlyViewedIds = parseMetafieldJson<string[]>(mfMap.get('recently_viewed_ids'), []);
  const rxRequests = parseMetafieldJson<PrescriptionRequest[]>(mfMap.get('rx_requests'), []);
  const subscriptions = parseMetafieldJson<MedicineSubscription[]>(mfMap.get('subscriptions'), []);

  return {
    user,
    orders,
    wishlistIds,
    recentlyViewedIds,
    rxRequests,
    subscriptions,
  };
}

export async function setCustomerMetafields(
  customerId: string,
  entries: Array<{ key: string; value: string; type?: string }>
) {
  if (entries.length === 0) return;
  const res = await shopifyAdminQuery<{
    metafieldsSet: { userErrors: Array<{ field: string[]; message: string }> };
  }>(
    `mutation($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id key }
        userErrors { field message }
      }
    }`,
    {
      metafields: entries.map((e) => ({
        ownerId: customerId,
        namespace: 'xmedcar',
        key: e.key,
        type: e.type || 'json',
        value: e.value,
      })),
    },
    { cache: 'no-store' }
  );
  if (res.metafieldsSet.userErrors.length > 0) {
    throw new Error(res.metafieldsSet.userErrors.map((u) => u.message).join('; '));
  }
}

export async function normalizeRegistrationEmail(identifier: string): Promise<{
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    const local = trimmed.split('@')[0];
    return {
      email: trimmed.toLowerCase(),
      username: local,
      firstName: local.charAt(0).toUpperCase() + local.slice(1),
      lastName: 'Customer',
    };
  }
  const slug = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '') || `member${Date.now()}`;
  return {
    email: `${slug}.xmedcar@gmail.com`,
    username: trimmed,
    firstName: trimmed,
    lastName: 'Customer',
  };
}

export async function createShopifyCustomerAccount(params: {
  identifier: string;
  password: string;
}): Promise<RawAdminCustomerNode> {
  const { email, username, firstName, lastName } = await normalizeRegistrationEmail(params.identifier);

  // Check if customer already exists
  const existing = await findAdminCustomerByIdentifier(email);
  if (existing) {
    throw new Error('An account with this email or username already exists. Please sign in.');
  }

  // Create customer via Admin API (guaranteed even with custom Storefront settings)
  const createRes = await shopifyAdminQuery<{
    customerCreate: {
      customer: { id: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer { id }
        userErrors { field message }
      }
    }`,
    {
      input: {
        email,
        firstName,
        lastName,
        tags: ['xmedcar-customer'],
        addresses: [
          {
            firstName,
            lastName,
            address1: 'House 24-B, Khayaban-e-Ittehad, DHA Phase 6',
            address2: 'Clifton Block 5',
            city: 'Karachi',
            province: 'Sindh',
            zip: '75600',
            country: 'Pakistan',
            phone: '+923008451290',
          },
        ],
      },
    },
    { cache: 'no-store' }
  );

  const created = createRes.customerCreate.customer;
  if (!created) {
    throw new Error(
      createRes.customerCreate.userErrors.map((e) => e.message).join('; ') ||
        'Unable to create Shopify customer account.'
    );
  }

  // Also mirror customer password to Storefront if possible (best-effort)
  await shopifyStorefrontQuery(
    `mutation($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id }
        customerUserErrors { message }
      }
    }`,
    { input: { email, password: params.password, firstName, lastName } },
    { cache: 'no-store' }
  ).catch(() => {});

  const passwordHash = hashCustomerPassword(params.password);
  await setCustomerMetafields(created.id, [
    { key: 'password_hash', value: passwordHash, type: 'single_line_text_field' },
    { key: 'username', value: username, type: 'single_line_text_field' },
    { key: 'wishlist_ids', value: '[]', type: 'json' },
    { key: 'recently_viewed_ids', value: '[]', type: 'json' },
    { key: 'rx_requests', value: '[]', type: 'json' },
    { key: 'subscriptions', value: '[]', type: 'json' },
  ]);

  const full = await fetchAdminCustomerById(created.id);
  if (!full) throw new Error('Customer created but failed to reload.');
  return full;
}

export async function authenticateShopifyCustomer(params: {
  identifier: string;
  password: string;
}): Promise<RawAdminCustomerNode> {
  const customer = await findAdminCustomerByIdentifier(params.identifier);
  if (!customer || !customer.email) {
    throw new Error('No Shopify customer found with that email or username.');
  }

  // 1. Try Storefront customerAccessTokenCreate (if customer was created via Storefront password)
  let verified = false;
  try {
    const sfRes = await shopifyStorefrontQuery<{
      customerAccessTokenCreate: {
        customerAccessToken: { accessToken: string } | null;
      };
    }>(
      `mutation($input: CustomerAccessTokenCreateInput!) {
        customerAccessTokenCreate(input: $input) {
          customerAccessToken { accessToken }
        }
      }`,
      { input: { email: customer.email, password: params.password } },
      { cache: 'no-store' }
    );
    if (sfRes.customerAccessTokenCreate.customerAccessToken?.accessToken) {
      verified = true;
    }
  } catch {
    // Storefront password login may not apply when New Customer Accounts are active
  }

  // 2. Verify scrypt password hash stored in xmedcar.password_hash metafield
  if (!verified) {
    const hash = customer.metafields?.nodes.find((m) => m.key === 'password_hash')?.value;
    if (hash) {
      verified = verifyCustomerPassword(params.password, hash);
    } else if (params.password.length >= 4) {
      // Legacy Admin-imported customer without a password yet: enroll first password cleanly
      const newHash = hashCustomerPassword(params.password);
      await setCustomerMetafields(customer.id, [
        { key: 'password_hash', value: newHash, type: 'single_line_text_field' },
      ]);
      verified = true;
    }
  }

  if (!verified) {
    throw new Error('Incorrect password. Please try again.');
  }

  return customer;
}

export async function uploadRxFileToShopifyCdn(
  file: PrescriptionFileMeta
): Promise<string | undefined> {
  if (!file.previewDataUrl || !file.previewDataUrl.startsWith('data:')) {
    return file.previewDataUrl;
  }
  const match = file.previewDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return undefined;
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const isImage = mimeType.startsWith('image/');
  const resource = isImage ? 'IMAGE' : 'FILE';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_') || `rx-${Date.now()}.png`;

  try {
    const stagedRes = await shopifyAdminQuery<{
      stagedUploadsCreate: {
        stagedTargets: Array<{
          url: string;
          resourceUrl: string;
          parameters: Array<{ name: string; value: string }>;
        }>;
      };
    }>(
      `mutation($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
        }
      }`,
      {
        input: [
          {
            filename: safeName,
            mimeType,
            resource,
            httpMethod: 'POST',
            fileSize: String(buffer.length),
          },
        ],
      },
      { cache: 'no-store' }
    );

    const target = stagedRes.stagedUploadsCreate.stagedTargets[0];
    if (!target) return undefined;

    const form = new FormData();
    for (const p of target.parameters) {
      form.append(p.name, p.value);
    }
    form.append('file', new Blob([buffer], { type: mimeType }), safeName);

    const uploadRes = await fetch(target.url, { method: 'POST', body: form });
    if (!uploadRes.ok) return undefined;

    const fileRes = await shopifyAdminQuery<{
      fileCreate: {
        files: Array<{
          id: string;
          image?: { url: string };
          url?: string;
        }>;
      };
    }>(
      `mutation($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            ... on MediaImage { image { url } }
            ... on GenericFile { url }
          }
        }
      }`,
      {
        files: [
          {
            alt: `Rx Document: ${safeName}`,
            contentType: isImage ? 'IMAGE' : 'FILE',
            originalSource: target.resourceUrl,
          },
        ],
      },
      { cache: 'no-store' }
    );

    const createdFile = fileRes.fileCreate.files[0];
    return createdFile?.image?.url || createdFile?.url || target.resourceUrl;
  } catch (err) {
    console.warn('[Shopify Rx Upload Warning]', err);
    return undefined;
  }
}

export async function lookupShopifyOrderByNumberAndEmail(
  orderNumber: string,
  email: string | undefined,
  catalog: Product[] = []
): Promise<Order | null> {
  const cleanNum = orderNumber.trim().replace(/^#/, '');
  if (!cleanNum) return null;

  const res = await shopifyAdminQuery<{ orders: { nodes: RawAdminOrderNode[] } }>(
    `query($q: String!) {
      orders(first: 10, query: $q, sortKey: CREATED_AT, reverse: true) {
        nodes {
          id name email phone createdAt cancelledAt
          displayFinancialStatus displayFulfillmentStatus statusPageUrl
          note tags
          customAttributes { key value }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          totalDiscountsSet { shopMoney { amount currencyCode } }
          totalPriceSet { shopMoney { amount currencyCode } }
          shippingAddress {
            firstName lastName address1 address2 city province zip country phone
          }
          customer { id firstName lastName email phone }
          lineItems(first: 20) {
            nodes {
              title quantity
              originalUnitPriceSet { shopMoney { amount } }
              variant {
                id title image { url }
                product { id handle images(first: 1) { nodes { url } } }
              }
            }
          }
        }
      }
    }`,
    { q: `name:#${cleanNum}` },
    { cache: 'no-store' }
  );

  const cleanEmail = email?.trim().toLowerCase();
  const match = res.orders.nodes.find((node) => {
    const numMatches = node.name.replace(/^#/, '').toLowerCase() === cleanNum.toLowerCase();
    if (!numMatches) return false;
    if (!cleanEmail) return true;
    const orderEmail = (
      node.customAttributes?.find((a) => a.key === 'customer_email')?.value ||
      node.email ||
      node.customer?.email ||
      ''
    ).toLowerCase();
    return orderEmail === cleanEmail || !orderEmail;
  });

  return match ? mapAdminOrderToStoreOrder(match, catalog) : null;
}

export async function cancelShopifyOrder(orderId: string): Promise<void> {
  const res = await shopifyAdminQuery<{
    orderCancel: { userErrors: Array<{ message: string }> };
  }>(
    `mutation($orderId: ID!) {
      orderCancel(orderId: $orderId, reason: CUSTOMER, restock: true, notifyCustomer: false) {
        userErrors { message }
      }
    }`,
    { orderId },
    { cache: 'no-store' }
  );
  if (res.orderCancel.userErrors.length > 0) {
    throw new Error(res.orderCancel.userErrors.map((u) => u.message).join('; '));
  }
}

export async function markShopifyOrderPaid(orderId: string): Promise<void> {
  const res = await shopifyAdminQuery<{
    orderMarkAsPaid: { userErrors: Array<{ message: string }> };
  }>(
    `mutation($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        userErrors { message }
      }
    }`,
    { input: { id: orderId } },
    { cache: 'no-store' }
  );
  if (res.orderMarkAsPaid.userErrors.length > 0) {
    throw new Error(res.orderMarkAsPaid.userErrors.map((u) => u.message).join('; '));
  }
}
