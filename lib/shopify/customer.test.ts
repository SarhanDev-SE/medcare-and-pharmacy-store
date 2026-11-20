import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashCustomerPassword,
  verifyCustomerPassword,
  signSessionToken,
  verifySessionToken,
  parseMetafieldJson,
  mapAdminOrderStatus,
  mapAdminOrderToStoreOrder,
  mapAdminCustomerToProfile,
  type RawAdminCustomerNode,
  type RawAdminOrderNode,
} from './customer';

test('hashCustomerPassword and verifyCustomerPassword validate matching and non-matching passwords', () => {
  const hash = hashCustomerPassword('xmedcar123');
  assert.ok(hash.startsWith('scrypt$'));
  assert.equal(verifyCustomerPassword('xmedcar123', hash), true);
  assert.equal(verifyCustomerPassword('wrongpass', hash), false);
  assert.equal(verifyCustomerPassword('xmedcar123', undefined), false);
});

test('signSessionToken and verifySessionToken round-trip valid session and reject tampered/expired tokens', () => {
  const token = signSessionToken({
    customerId: 'gid://shopify/Customer/27750573965393',
    email: 'customer.xmedcar@gmail.com',
    exp: Date.now() + 60_000,
  });
  const parsed = verifySessionToken(token);
  assert.equal(parsed?.customerId, 'gid://shopify/Customer/27750573965393');
  assert.equal(parsed?.email, 'customer.xmedcar@gmail.com');

  const [data, sig] = token.split('.');
  const tampered = `${data}.${sig.slice(0, -1)}${sig.endsWith('a') ? 'b' : 'a'}`;
  assert.equal(verifySessionToken(tampered), null);

  const expired = signSessionToken({
    customerId: 'gid://shopify/Customer/1',
    email: 'a@b.com',
    exp: Date.now() - 1000,
  });
  assert.equal(verifySessionToken(expired), null);
});

test('parseMetafieldJson returns parsed JSON or fallback on invalid/missing input', () => {
  assert.deepEqual(parseMetafieldJson<string[]>('["p1","p2"]', []), ['p1', 'p2']);
  assert.deepEqual(parseMetafieldJson<string[]>('not-json', ['fallback']), ['fallback']);
  assert.deepEqual(parseMetafieldJson<string[]>(undefined, []), []);
});

test('mapAdminOrderStatus maps Shopify financial and fulfillment statuses accurately', () => {
  const base: RawAdminOrderNode = {
    id: 'gid://shopify/Order/1',
    name: '#1002',
    createdAt: '2026-11-20T00:00:00Z',
    lineItems: { nodes: [] },
  };
  assert.equal(mapAdminOrderStatus({ ...base, cancelledAt: '2026-11-20T01:00:00Z' }), 'Cancelled');
  assert.equal(mapAdminOrderStatus({ ...base, displayFulfillmentStatus: 'FULFILLED' }), 'Completed');
  assert.equal(mapAdminOrderStatus({ ...base, displayFinancialStatus: 'PENDING' }), 'Pending payment');
  assert.equal(mapAdminOrderStatus({ ...base, displayFinancialStatus: 'PAID' }), 'Processing');
});

test('mapAdminOrderToStoreOrder parses PKR totals, shipping address, Rx metadata, and line items', () => {
  const node: RawAdminOrderNode = {
    id: 'gid://shopify/Order/999',
    name: '#1002',
    email: 'customer.xmedcar@gmail.com',
    phone: '+92 300 8451290',
    createdAt: '2026-11-20T12:00:00Z',
    displayFinancialStatus: 'PAID',
    displayFulfillmentStatus: 'UNFULFILLED',
    note: 'Payment Method: Direct bank transfer | Prescription Document: rx-script.png',
    tags: ['Xmedcar Headless', 'Rx Order'],
    customAttributes: [
      { key: 'customer_email', value: 'customer.xmedcar@gmail.com' },
      { key: 'rx_document_name', value: 'rx-script.png' },
      { key: 'rx_document_url', value: 'https://cdn.shopify.com/rx-script.png' },
    ],
    subtotalPriceSet: { shopMoney: { amount: '3450.00', currencyCode: 'PKR' } },
    totalShippingPriceSet: { shopMoney: { amount: '350.00', currencyCode: 'PKR' } },
    totalDiscountsSet: { shopMoney: { amount: '0.00', currencyCode: 'PKR' } },
    totalPriceSet: { shopMoney: { amount: '3800.00', currencyCode: 'PKR' } },
    shippingAddress: {
      firstName: 'Tariq',
      lastName: 'Mahmood',
      address1: 'House 24-B',
      city: 'Karachi',
      province: 'Sindh',
      zip: '75600',
      country: 'Pakistan',
    },
    lineItems: {
      nodes: [
        {
          title: 'Gaia Calm Gummies',
          quantity: 2,
          originalUnitPriceSet: { shopMoney: { amount: '1725.00' } },
          variant: {
            id: 'gid://shopify/ProductVariant/1',
            title: '30 Gummies',
            product: { id: 'gid://shopify/Product/1', handle: 'gaia-calm-gummies' },
          },
        },
      ],
    },
  };

  const mapped = mapAdminOrderToStoreOrder(node);
  assert.equal(mapped.number, '#1002');
  assert.equal(mapped.status, 'Processing');
  assert.equal(mapped.total, 3800);
  assert.equal(mapped.shipping, 350);
  assert.equal(mapped.paymentMethod, 'Direct bank transfer');
  assert.equal(mapped.prescriptionFile?.name, 'rx-script.png');
  assert.equal(mapped.prescriptionFile?.previewDataUrl, 'https://cdn.shopify.com/rx-script.png');
  assert.equal(mapped.items[0].variantLabel, '30 Gummies');
  assert.equal(mapped.items[0].isRx, true);
});

test('mapAdminCustomerToProfile falls back safely to default Pakistan billing fields', () => {
  const customer: RawAdminCustomerNode = {
    id: 'gid://shopify/Customer/27750573965393',
    firstName: 'Tariq',
    lastName: 'Mahmood',
    email: 'customer.xmedcar@gmail.com',
    phone: '+92 300 8451290',
    defaultAddress: {
      id: 'gid://shopify/MailingAddress/1',
      firstName: 'Tariq',
      lastName: 'Mahmood',
      address1: 'House 24-B, Khayaban-e-Ittehad, DHA Phase 6',
      address2: 'Clifton Block 5',
      city: 'Karachi',
      province: 'Sindh',
      zip: '75600',
      country: 'Pakistan',
      phone: '+92 300 8451290',
    },
  };
  const profile = mapAdminCustomerToProfile(customer);
  assert.equal(profile.name, 'Tariq Mahmood');
  assert.equal(profile.billingAddress.city, 'Karachi');
  assert.equal(profile.billingAddress.country, 'Pakistan');
});
