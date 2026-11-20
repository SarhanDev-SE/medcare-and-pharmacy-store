/**
 * Idempotent sync script to configure Shopify store settings, update the demo customer to valid Pakistan details,
 * and seed real Shopify Orders, Rx Requests, and Medicine Subscriptions directly in Shopify Admin.
 * Run: npx tsx scripts/sync-shopify-customer-and-settings.ts
 */
import { shopifyAdminQuery } from '../lib/shopify/client';
import {
  findAdminCustomerByIdentifier,
  hashCustomerPassword,
  setCustomerMetafields,
} from '../lib/shopify/customer';
import { getShopifyStorefrontData } from '../lib/shopify/storefront';
import { getSubscriptionPrice } from '../lib/store-logic';

async function syncStoreSettingsMetaobject() {
  const existing = await shopifyAdminQuery<{
    metaobjects: { nodes: Array<{ id: string; handle: string; fields: Array<{ key: string; value: string }> }> };
  }>(
    `{
      metaobjects(type: "xmedcar_store_settings", first: 5) {
        nodes { id handle fields { key value } }
      }
    }`,
    {},
    { cache: 'no-store' }
  );

  const settingsNode = existing.metaobjects.nodes[0];
  if (!settingsNode) {
    console.log('No xmedcar_store_settings metaobject found; skipping update.');
    return;
  }

  await shopifyAdminQuery(
    `mutation($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject { id }
        userErrors { field message }
      }
    }`,
    {
      id: settingsNode.id,
      metaobject: {
        fields: [
          { key: 'phone', value: '+92 21 111 963 322' },
          { key: 'email', value: 'support@xmedcar.pk' },
          { key: 'address', value: 'Clifton Block 5, Karachi, Pakistan' },
          { key: 'contact_address', value: 'Suite 402, Clifton Medical Plaza, Karachi, Pakistan' },
          { key: 'hours_weekday', value: '8:00am - 10:00pm PKT' },
          { key: 'hours_sunday', value: '10:00am - 6:00pm PKT' },
          { key: 'currency_code', value: 'PKR' },
          { key: 'country', value: 'Pakistan' },
          { key: 'free_shipping_threshold', value: '15000' },
          { key: 'standard_shipping_fee', value: '350' },
        ],
      },
    },
    { cache: 'no-store' }
  );
  console.log('Updated xmedcar_store_settings metaobject with Pakistan contact & PKR shipping info.');
}

async function syncDemoCustomerAndOrders() {
  const storefront = await getShopifyStorefrontData();
  const relax =
    storefront.products.find((p) => p.slug.includes('relax')) ?? storefront.products[0];
  const vitD =
    storefront.products.find((p) => p.slug.includes('vitamin-d')) ?? storefront.products[1];
  const probiotic =
    storefront.products.find((p) => p.slug.includes('probiotic')) ?? storefront.products[2];

  // Find either updated email or old .pk customer
  let customer =
    (await findAdminCustomerByIdentifier('customer.xmedcar@gmail.com')) ??
    (await findAdminCustomerByIdentifier('customer@xmedcar.pk'));

  if (!customer) {
    const createRes = await shopifyAdminQuery<{
      customerCreate: { customer: { id: string } | null; userErrors: Array<{ message: string }> };
    }>(
      `mutation($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer { id }
          userErrors { message }
        }
      }`,
      {
        input: {
          firstName: 'Tariq',
          lastName: 'Mahmood',
          email: 'customer.xmedcar@gmail.com',
          phone: '+923008451290',
          tags: ['xmedcar-customer', 'demo-member'],
          addresses: [
            {
              firstName: 'Tariq',
              lastName: 'Mahmood',
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
    const id = createRes.customerCreate.customer?.id;
    if (!id) throw new Error(createRes.customerCreate.userErrors.map((e) => e.message).join('; '));
    customer = (await findAdminCustomerByIdentifier('customer.xmedcar@gmail.com'))!;
  } else if (customer.email !== 'customer.xmedcar@gmail.com') {
    await shopifyAdminQuery(
      `mutation($input: CustomerInput!) {
        customerUpdate(input: $input) {
          customer { id email }
          userErrors { message }
        }
      }`,
      {
        input: {
          id: customer.id,
          email: 'customer.xmedcar@gmail.com',
          firstName: 'Tariq',
          lastName: 'Mahmood',
          phone: '+923008451290',
        },
      },
      { cache: 'no-store' }
    );
    console.log('Updated demo customer email to customer.xmedcar@gmail.com');
  }

  // Clean up any unfinished test DraftOrders from earlier attempts
  const oldDrafts = await shopifyAdminQuery<{
    draftOrders: { nodes: Array<{ id: string }> };
  }>(`{ draftOrders(first: 10) { nodes { id } } }`, {}, { cache: 'no-store' });
  for (const d of oldDrafts.draftOrders.nodes) {
    await shopifyAdminQuery(
      `mutation($input: DraftOrderDeleteInput!) { draftOrderDelete(input: $input) { deletedId } }`,
      { input: { id: d.id } },
      { cache: 'no-store' }
    ).catch(() => {});
  }

  // Delete temporary test_sync metafield if present
  await shopifyAdminQuery(
    `mutation($metafields: [MetafieldIdentifierInput!]!) {
      metafieldsDelete(metafields: $metafields) {
        deletedMetafields { key }
        userErrors { message }
      }
    }`,
    {
      metafields: [{ ownerId: customer.id, namespace: 'xmedcar', key: 'test_sync' }],
    },
    { cache: 'no-store' }
  ).catch(() => {});

  // Seed starter real orders on Shopify using orderCreate if customer has fewer than 2 orders
  const existingOrdersCount = customer.orders?.nodes.length ?? 0;
  let firstOrderName = customer.orders?.nodes[0]?.name || '#1001';
  if (existingOrdersCount < 2 && relax && vitD) {
    const createRealOrder = async (params: {
      productsToAdd: Array<{ variantId: string; price: number; title: string }>;
      financialStatus: 'PENDING' | 'PAID';
      note: string;
      tags: string[];
      customAttributes?: Array<{ key: string; value: string }>;
    }) => {
      const orderRes = await shopifyAdminQuery<{
        orderCreate: {
          order: { id: string; name: string } | null;
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(
        `mutation($order: OrderCreateOrderInput!) {
          orderCreate(order: $order) {
            order { id name }
            userErrors { field message }
          }
        }`,
        {
          order: {
            customer: { toAssociate: { id: customer!.id } },
            email: 'customer.xmedcar@gmail.com',
            currency: 'PKR',
            financialStatus: params.financialStatus,
            note: params.note,
            tags: params.tags,
            customAttributes: params.customAttributes ?? [],
            shippingAddress: {
              firstName: 'Tariq',
              lastName: 'Mahmood',
              address1: 'House 24-B, Khayaban-e-Ittehad, DHA Phase 6',
              address2: 'Clifton Block 5',
              city: 'Karachi',
              province: 'Sindh',
              zip: '75600',
              country: 'Pakistan',
              phone: '+923008451290',
            },
            shippingLines: [
              {
                title: 'Free Express Pharmacy Shipping (Pakistan)',
                priceSet: { shopMoney: { amount: '0.00', currencyCode: 'PKR' } },
              },
            ],
            lineItems: params.productsToAdd.map((p) => ({
              variantId: p.variantId,
              quantity: 1,
            })),
          },
        },
        { cache: 'no-store' }
      );
      if (orderRes.orderCreate.userErrors.length > 0) {
        console.warn('orderCreate warnings:', orderRes.orderCreate.userErrors);
      }
      return orderRes.orderCreate.order ?? null;
    };

    const ord1 = await createRealOrder({
      productsToAdd: [
        { variantId: relax.variants[0].shopifyVariantId!, price: relax.price, title: relax.name },
        { variantId: vitD.variants[0].shopifyVariantId!, price: vitD.price, title: vitD.name },
      ],
      financialStatus: 'PENDING',
      note: 'Payment Method: Direct bank transfer | Prescription Document: dr-ahmed-prescription.png',
      tags: ['Xmedcar Headless', 'Rx Order'],
      customAttributes: [
        { key: 'rx_document_name', value: 'dr-ahmed-prescription.png' },
        { key: 'rx_document_url', value: relax.image },
        { key: 'customer_email', value: 'customer.xmedcar@gmail.com' },
      ],
    });
    const ord2 = probiotic
      ? await createRealOrder({
          productsToAdd: [
            {
              variantId: probiotic.variants[0].shopifyVariantId!,
              price: probiotic.price,
              title: probiotic.name,
            },
          ],
          financialStatus: 'PAID',
          note: 'Payment Method: Cash on delivery',
          tags: ['Xmedcar Headless', 'OTC Order'],
          customAttributes: [{ key: 'customer_email', value: 'customer.xmedcar@gmail.com' }],
        })
      : null;

    if (ord1?.name) firstOrderName = ord1.name;
    console.log('Seeded real Shopify Orders:', ord1?.name, ord2?.name);
  }

  // Seed wishlist, recently viewed, Rx requests, and subscriptions in customer metafields
  const rxList = relax
    ? [
        {
          id: 'rx-shopify-1',
          requestNumber: '#RX-417',
          date: 'June 16, 2026',
          fullName: 'Tariq Mahmood',
          phone: '+92 300 8451290',
          status: 'Converted',
          convertedOrderNumber: firstOrderName,
          file: {
            name: 'dr-ahmed-prescription.png',
            size: 142840,
            type: 'image/png',
            uploadedAt: 'June 16, 2026',
            previewDataUrl: relax.image,
          },
        },
        {
          id: 'rx-shopify-2',
          requestNumber: '#RX-418',
          date: 'June 19, 2026',
          fullName: 'Tariq Mahmood',
          phone: '+92 300 8451290',
          status: 'Pending',
          file: {
            name: 'followup-rx-karachi.png',
            size: 118420,
            type: 'image/png',
            uploadedAt: 'June 19, 2026',
            previewDataUrl: relax.image,
          },
        },
      ]
    : [];

  const subsList = [
    ...(probiotic
      ? [
          {
            id: 'sub-shopify-1',
            productId: probiotic.id,
            productName: probiotic.name,
            image: probiotic.image,
            intervalDays: 60,
            quantity: 1,
            pricePerCycle: getSubscriptionPrice(probiotic.price),
            nextRenewal: 'August 15, 2026',
            status: 'ACTIVE',
            history: [
              {
                orderNumber: firstOrderName,
                label: 'Initial',
                date: 'June 16, 2026',
                status: 'Completed',
              },
            ],
          },
        ]
      : []),
    ...(relax
      ? [
          {
            id: 'sub-shopify-2',
            productId: relax.id,
            productName: relax.name,
            image: relax.image,
            intervalDays: 30,
            quantity: 1,
            pricePerCycle: getSubscriptionPrice(relax.price),
            nextRenewal: 'July 16, 2026',
            status: 'PAUSED',
            history: [
              {
                orderNumber: firstOrderName,
                label: 'Initial',
                date: 'June 16, 2026',
                status: 'Completed',
              },
            ],
          },
        ]
      : []),
  ];

  await setCustomerMetafields(customer.id, [
    { key: 'username', value: 'tariq', type: 'single_line_text_field' },
    { key: 'password_hash', value: hashCustomerPassword('xmedcar123'), type: 'single_line_text_field' },
    {
      key: 'wishlist_ids',
      value: JSON.stringify(storefront.products.slice(0, 3).map((p) => p.id)),
      type: 'json',
    },
    {
      key: 'recently_viewed_ids',
      value: JSON.stringify(storefront.products.slice(0, 4).map((p) => p.id)),
      type: 'json',
    },
    { key: 'rx_requests', value: JSON.stringify(rxList), type: 'json' },
    { key: 'subscriptions', value: JSON.stringify(subsList), type: 'json' },
  ]);

  console.log('Synced demo customer metafields (wishlist, recently_viewed, rx_requests, subscriptions) in Shopify Admin!');
}

async function main() {
  await syncStoreSettingsMetaobject();
  await syncDemoCustomerAndOrders();
  console.log('Shopify Customer & Store Settings sync complete!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
