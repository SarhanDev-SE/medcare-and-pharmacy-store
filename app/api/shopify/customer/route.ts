import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminQuery } from '@/lib/shopify/client';
import {
  buildCustomerAccountSnapshot,
  cancelShopifyOrder,
  fetchAdminCustomerById,
  markShopifyOrderPaid,
  parseMetafieldJson,
  SESSION_COOKIE_NAME,
  setCustomerMetafields,
  uploadRxFileToShopifyCdn,
  verifySessionToken,
} from '@/lib/shopify/customer';
import { getShopifyStorefrontData } from '@/lib/shopify/storefront';
import { transitionSubscription } from '@/lib/store-logic';
import type { MedicineSubscription, PrescriptionFileMeta, PrescriptionRequest, UserProfile } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const [customer, storefront] = await Promise.all([
      fetchAdminCustomerById(session.customerId),
      getShopifyStorefrontData(),
    ]);
    if (!customer) {
      return NextResponse.json({ authenticated: false });
    }
    const snapshot = buildCustomerAccountSnapshot(customer, storefront.products);
    return NextResponse.json({ authenticated: true, ...snapshot });
  } catch (err) {
    console.error('[Shopify Customer GET]', err);
    return NextResponse.json({ authenticated: false });
  }
}

export async function PATCH(req: NextRequest) {
  const session = verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      action:
        | 'sync_wishlist'
        | 'sync_recently_viewed'
        | 'update_profile'
        | 'submit_rx'
        | 'update_subscription'
        | 'cancel_order'
        | 'pay_order';
      wishlistIds?: string[];
      recentlyViewedIds?: string[];
      profile?: Partial<UserProfile>;
      rxPayload?: { fullName: string; phone: string; file: PrescriptionFileMeta };
      subscriptionId?: string;
      subscriptionAction?: 'pause' | 'resume' | 'cancel' | { type: 'interval'; days: 30 | 60 | 90 };
      orderId?: string;
    };

    const customer = await fetchAdminCustomerById(session.customerId);
    if (!customer) {
      return NextResponse.json({ ok: false, error: 'Customer not found.' }, { status: 404 });
    }

    if (body.action === 'sync_wishlist' && Array.isArray(body.wishlistIds)) {
      await setCustomerMetafields(customer.id, [
        { key: 'wishlist_ids', value: JSON.stringify(body.wishlistIds.slice(0, 40)), type: 'json' },
      ]);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'sync_recently_viewed' && Array.isArray(body.recentlyViewedIds)) {
      await setCustomerMetafields(customer.id, [
        {
          key: 'recently_viewed_ids',
          value: JSON.stringify(body.recentlyViewedIds.slice(0, 12)),
          type: 'json',
        },
      ]);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'update_profile' && body.profile) {
      const nameParts = (body.profile.name || '').trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] || customer.firstName || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || customer.lastName || 'Member';
      await shopifyAdminQuery(
        `mutation($input: CustomerInput!) {
          customerUpdate(input: $input) {
            customer { id }
            userErrors { field message }
          }
        }`,
        {
          input: {
            id: customer.id,
            firstName,
            lastName,
            ...(body.profile.email ? { email: body.profile.email.trim() } : {}),
            ...(body.profile.phone ? { phone: body.profile.phone.trim() } : {}),
          },
        },
        { cache: 'no-store' }
      ).catch((e) => console.warn('[customerUpdate]', e));

      if (body.profile.billingAddress) {
        const ba = body.profile.billingAddress;
        const addrInput = {
          firstName: ba.firstName || firstName,
          lastName: ba.lastName || lastName,
          address1: ba.street1,
          address2: ba.street2,
          city: ba.city,
          province: ba.state,
          zip: ba.zip,
          country: ba.country || 'Pakistan',
          phone: ba.phone,
        };
        if (customer.defaultAddress?.id) {
          await shopifyAdminQuery(
            `mutation($customerId: ID!, $addressId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) {
              customerAddressUpdate(customerId: $customerId, addressId: $addressId, address: $address, setAsDefault: $setAsDefault) {
                userErrors { message }
              }
            }`,
            { customerId: customer.id, addressId: customer.defaultAddress.id, address: addrInput, setAsDefault: true },
            { cache: 'no-store' }
          ).catch(() => {});
        } else {
          await shopifyAdminQuery(
            `mutation($customerId: ID!, $address: MailingAddressInput!, $setAsDefault: Boolean) {
              customerAddressCreate(customerId: $customerId, address: $address, setAsDefault: $setAsDefault) {
                userErrors { message }
              }
            }`,
            { customerId: customer.id, address: addrInput, setAsDefault: true },
            { cache: 'no-store' }
          ).catch(() => {});
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'submit_rx' && body.rxPayload) {
      const existingRaw = customer.metafields?.nodes.find((m) => m.key === 'rx_requests')?.value;
      const existing = parseMetafieldJson<PrescriptionRequest[]>(existingRaw, []);
      const cdnUrl = await uploadRxFileToShopifyCdn(body.rxPayload.file);
      const nextNum = 417 + existing.length + 1;
      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      const newReq: PrescriptionRequest = {
        id: `rx-${Date.now()}`,
        requestNumber: `#RX-${nextNum}`,
        date: todayStr,
        fullName: body.rxPayload.fullName,
        phone: body.rxPayload.phone,
        status: 'Pending',
        file: {
          ...body.rxPayload.file,
          previewDataUrl: cdnUrl || body.rxPayload.file.previewDataUrl,
        },
      };
      const updated = [newReq, ...existing].slice(0, 30);
      await setCustomerMetafields(customer.id, [
        { key: 'rx_requests', value: JSON.stringify(updated), type: 'json' },
      ]);
      return NextResponse.json({ ok: true, rxRequest: newReq, rxRequests: updated });
    }

    if (body.action === 'update_subscription' && body.subscriptionId && body.subscriptionAction) {
      const existingRaw = customer.metafields?.nodes.find((m) => m.key === 'subscriptions')?.value;
      const existing = parseMetafieldJson<MedicineSubscription[]>(existingRaw, []);
      const updated = existing.map((s) =>
        s.id === body.subscriptionId ? transitionSubscription(s, body.subscriptionAction!) : s
      );
      await setCustomerMetafields(customer.id, [
        { key: 'subscriptions', value: JSON.stringify(updated), type: 'json' },
      ]);
      return NextResponse.json({ ok: true, subscriptions: updated });
    }

    if (body.action === 'cancel_order' && body.orderId) {
      await cancelShopifyOrder(body.orderId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === 'pay_order' && body.orderId) {
      await markShopifyOrderPaid(body.orderId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action.' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Shopify customer sync failed.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
