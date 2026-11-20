import { NextRequest, NextResponse } from 'next/server';
import { getShopifyConfig, shopifyAdminQuery, shopifyStorefrontQuery } from '@/lib/shopify/client';
import {
  CART_COOKIE_NAME,
  fetchAdminCustomerById,
  findAdminCustomerByIdentifier,
  parseMetafieldJson,
  SESSION_COOKIE_NAME,
  setCustomerMetafields,
  uploadRxFileToShopifyCdn,
  verifySessionToken,
} from '@/lib/shopify/customer';
import type { CartItem, MedicineSubscription, PrescriptionFileMeta } from '@/lib/types';

interface CheckoutBody {
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  orderNotes?: string;
  couponCode?: string | null;
  discountAmount?: number;
  shippingCost?: number;
  hasRx?: boolean;
  rxFileName?: string;
  rxFile?: PrescriptionFileMeta;
  items: CartItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutBody;
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ ok: false, error: 'Cart is empty.' }, { status: 400 });
    }

    const { domain, adminToken, storefrontToken, clientId, clientSecret } = getShopifyConfig();
    if (!domain) {
      return NextResponse.json({ ok: false, error: 'Shopify is not configured.' }, { status: 500 });
    }

    let shopifyOrderId: string | undefined;
    let shopifyOrderName: string | undefined;
    let shopifyCheckoutUrl: string | undefined;
    let rxDocumentUrl: string | undefined;

    if (body.rxFile) {
      rxDocumentUrl = await uploadRxFileToShopifyCdn(body.rxFile);
    }

    // 1. Create a Storefront Cart URL in PKR so customer can optionally pay at hosted Shopify Checkout
    if (storefrontToken) {
      const lines = body.items
        .filter((i) => i.shopifyVariantId)
        .map((i) => ({
          merchandiseId: i.shopifyVariantId!,
          quantity: i.quantity,
        }));

      if (lines.length > 0) {
        const createCart = async (includeEmail: boolean) =>
          shopifyStorefrontQuery<{
            cartCreate: {
              cart: { id: string; checkoutUrl: string } | null;
              userErrors: Array<{ message: string }>;
            };
          }>(
            `mutation($input: CartInput!) {
              cartCreate(input: $input) {
                cart { id checkoutUrl }
                userErrors { message }
              }
            }`,
            {
              input: {
                lines,
                note: body.orderNotes || (body.hasRx ? `Rx Attached: ${body.rxFileName || 'Yes'}` : undefined),
                ...(body.couponCode ? { discountCodes: [body.couponCode] } : {}),
                buyerIdentity: {
                  ...(includeEmail && body.billingEmail ? { email: body.billingEmail } : {}),
                  countryCode: 'PK',
                },
              },
            },
            { cache: 'no-store' }
          );

        try {
          let cartRes = await createCart(true);
          if (!cartRes.cartCreate.cart && cartRes.cartCreate.userErrors?.length) {
            cartRes = await createCart(false);
          }
          shopifyCheckoutUrl = cartRes.cartCreate.cart?.checkoutUrl;
        } catch (cartErr) {
          console.warn('[Shopify cartCreate warning]', cartErr);
        }
      }
    }

    // 2. Create real Shopify Order via Admin orderCreate API (associating customer + PKR totals)
    if (adminToken || (clientId && clientSecret)) {
      try {
        const session = verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
        let customerNode = session ? await fetchAdminCustomerById(session.customerId) : null;
        if (!customerNode && body.billingEmail) {
          customerNode = await findAdminCustomerByIdentifier(body.billingEmail).catch(() => null);
        }

        const lineItems = body.items.map((item) =>
          item.shopifyVariantId
            ? {
                variantId: item.shopifyVariantId,
                quantity: item.quantity,
                ...(item.purchaseMode === 'subscription'
                  ? {
                      priceSet: {
                        shopMoney: {
                          amount: item.price.toFixed(2),
                          currencyCode: 'PKR',
                        },
                      },
                    }
                  : {}),
              }
            : {
                title: item.variantLabel ? `${item.name} (${item.variantLabel})` : item.name,
                priceSet: {
                  shopMoney: {
                    amount: item.price.toFixed(2),
                    currencyCode: 'PKR',
                  },
                },
                quantity: item.quantity,
                requiresShipping: true,
              }
        );

        const nameParts = body.billingName.trim().split(/\s+/);
        const firstName = body.shippingAddress.firstName || nameParts[0] || 'Customer';
        const lastName = body.shippingAddress.lastName || nameParts.slice(1).join(' ') || 'Xmedcar';

        const runOrderCreate = async (includeEmail: boolean) =>
          shopifyAdminQuery<{
            orderCreate: {
              order: { id: string; name: string; statusPageUrl?: string | null } | null;
              userErrors: Array<{ field: string[]; message: string }>;
            };
          }>(
            `mutation($order: OrderCreateOrderInput!) {
              orderCreate(order: $order) {
                order { id name statusPageUrl }
                userErrors { field message }
              }
            }`,
            {
              order: {
                ...(customerNode ? { customer: { toAssociate: { id: customerNode.id } } } : {}),
                ...(includeEmail && body.billingEmail ? { email: body.billingEmail.trim() } : {}),
                currency: 'PKR',
                financialStatus: body.paymentMethod === 'Cash on delivery' ? 'PENDING' : 'PENDING',
                note: [
                  `Payment Method: ${body.paymentMethod}`,
                  body.hasRx ? `Prescription Document: ${body.rxFileName || 'Verified'}` : null,
                  body.orderNotes ? `Customer Notes: ${body.orderNotes}` : null,
                ]
                  .filter(Boolean)
                  .join(' | '),
                tags: ['Xmedcar Headless', body.hasRx ? 'Rx Order' : 'OTC Order', body.paymentMethod],
                customAttributes: [
                  ...(body.billingEmail ? [{ key: 'customer_email', value: body.billingEmail.trim() }] : []),
                  ...(body.rxFileName ? [{ key: 'rx_document_name', value: body.rxFileName }] : []),
                  ...(rxDocumentUrl ? [{ key: 'rx_document_url', value: rxDocumentUrl }] : []),
                ],
                shippingAddress: {
                  firstName,
                  lastName,
                  address1: body.shippingAddress.address1,
                  address2: body.shippingAddress.address2 || '',
                  city: body.shippingAddress.city,
                  province: body.shippingAddress.province || '',
                  zip: body.shippingAddress.zip,
                  country: body.shippingAddress.country || 'Pakistan',
                  phone: body.billingPhone,
                },
                ...(typeof body.shippingCost === 'number'
                  ? {
                      shippingLines: [
                        {
                          title:
                            body.shippingCost === 0
                              ? 'Free Express Pharmacy Shipping (Pakistan)'
                              : 'Standard Pharmacy Delivery (Pakistan)',
                          priceSet: {
                            shopMoney: {
                              amount: body.shippingCost.toFixed(2),
                              currencyCode: 'PKR',
                            },
                          },
                        },
                      ],
                    }
                  : {}),
                ...(body.couponCode && body.discountAmount && body.discountAmount > 0
                  ? {
                      discountCode: {
                        itemFixedAmountDiscountCode: {
                          code: body.couponCode,
                          amountSet: {
                            shopMoney: {
                              amount: body.discountAmount.toFixed(2),
                              currencyCode: 'PKR',
                            },
                          },
                        },
                      },
                    }
                  : {}),
                lineItems,
              },
            },
            { cache: 'no-store' }
          );

        let orderRes = await runOrderCreate(true);
        if (!orderRes.orderCreate.order && orderRes.orderCreate.userErrors.length > 0) {
          // Retry without email field in case the typed domain lacks public MX DNS records
          orderRes = await runOrderCreate(false);
        }

        const createdOrder = orderRes.orderCreate.order;
        if (createdOrder) {
          shopifyOrderId = createdOrder.id;
          shopifyOrderName = createdOrder.name;
          if (!shopifyCheckoutUrl && createdOrder.statusPageUrl) {
            shopifyCheckoutUrl = createdOrder.statusPageUrl;
          }

          // Persist any newly purchased subscription items to the Shopify customer's metafields
          const subItems = body.items.filter((c) => c.purchaseMode === 'subscription');
          if (customerNode && subItems.length > 0) {
            const existingRaw = customerNode.metafields?.nodes.find(
              (m) => m.key === 'subscriptions'
            )?.value;
            const existingSubs = parseMetafieldJson<MedicineSubscription[]>(existingRaw, []);
            const todayStr = new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
            const renewalDate = new Date(Date.now() + 30 * 86400_000).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
            const newSubs: MedicineSubscription[] = subItems.map((c, idx) => ({
              id: `sub-${Date.now()}-${idx}`,
              productId: c.productId,
              productName: c.name,
              image: c.image,
              intervalDays: c.subscriptionIntervalDays ?? 30,
              quantity: c.quantity,
              pricePerCycle: c.price,
              nextRenewal: renewalDate,
              status: 'ACTIVE',
              history: [
                {
                  orderNumber: createdOrder.name,
                  label: 'Initial',
                  date: todayStr,
                  status: 'Processing',
                },
              ],
            }));
            await setCustomerMetafields(customerNode.id, [
              {
                key: 'subscriptions',
                value: JSON.stringify([...newSubs, ...existingSubs].slice(0, 30)),
                type: 'json',
              },
            ]).catch(() => {});
          }
        } else if (orderRes.orderCreate.userErrors.length > 0) {
          console.warn('[Shopify orderCreate userErrors]', orderRes.orderCreate.userErrors);
        }
      } catch (adminErr) {
        console.warn('[Shopify orderCreate warning]', adminErr);
      }
    }

    const res = NextResponse.json({
      ok: true,
      shopifyOrderId,
      shopifyOrderName,
      shopifyCheckoutUrl,
      rxDocumentUrl,
    });
    res.cookies.set(CART_COOKIE_NAME, '', { path: '/', maxAge: 0, sameSite: 'lax' });
    return res;
  } catch (err) {
    console.error('[Shopify Checkout Error]', err);
    return NextResponse.json(
      { ok: false, error: 'Failed to submit order to Shopify.' },
      { status: 500 }
    );
  }
}
