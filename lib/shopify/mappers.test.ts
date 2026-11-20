import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveCouponsFromAdminNodes,
  mapFaqItems,
  mapShopifyArticle,
  mapShopifyProduct,
  mapStoreSettings,
} from './mappers';
import { DEFAULT_STORE_SETTINGS } from './storefront';

test('mapShopifyProduct maps Storefront PKR variants, discounts, badges, and metafields', () => {
  const mapped = mapShopifyProduct({
    id: 'gid://shopify/Product/123',
    handle: 'gaia-herbs-relax-gummies',
    title: 'Gaia Herbs Relax Gummies',
    description: 'Calming botanical gummies',
    vendor: 'Gaia Herbs',
    productType: 'Herbal Gummies',
    tags: ['Rx', 'Temp Controlled', 'group:top-picks', 'tab:Medications', 'color:purple'],
    availableForSale: true,
    images: {
      nodes: [{ url: 'https://cdn.shopify.com/s/files/relax.png', altText: 'Relax' }],
    },
    variants: {
      nodes: [
        {
          id: 'gid://shopify/ProductVariant/1001',
          title: '30 Count',
          availableForSale: true,
          quantityAvailable: 20,
          price: { amount: '3640.0', currencyCode: 'PKR' },
          compareAtPrice: { amount: '4550.0', currencyCode: 'PKR' },
        },
        {
          id: 'gid://shopify/ProductVariant/1002',
          title: '60 Count (Pack Of 2)',
          availableForSale: true,
          quantityAvailable: 15,
          price: { amount: '14000.0', currencyCode: 'PKR' },
          compareAtPrice: null,
        },
      ],
    },
    metafields: [
      { key: 'legacy_id', value: 'gaia-relax-gummies' },
      { key: 'category', value: 'Pharmacy Medicines' },
      { key: 'is_rx', value: 'true' },
      { key: 'benefits_json', value: JSON.stringify(['Calm support', 'Sleep comfort']) },
      { key: 'rating', value: '4.9' },
      { key: 'review_count', value: '45' },
    ],
  });

  assert.equal(mapped.id, 'gaia-relax-gummies');
  assert.equal(mapped.shopifyId, 'gid://shopify/Product/123');
  assert.equal(mapped.price, 3640);
  assert.equal(mapped.originalPrice, 4550);
  assert.equal(mapped.discountPercent, 20);
  assert.equal(mapped.isRx, true);
  assert.equal(mapped.isTempControlled, true);
  assert.equal(mapped.featuredGroup, 'top-picks');
  assert.equal(mapped.productTypeTab, 'Medications');
  assert.deepEqual(mapped.colors, ['purple']);
  assert.equal(mapped.variants.length, 2);
  assert.equal(mapped.variants[0].shopifyVariantId, 'gid://shopify/ProductVariant/1001');
  assert.equal(mapped.benefits.length, 2);
});

test('deriveCouponsFromAdminNodes extracts ACTIVE percentage coupons cleanly', () => {
  const coupons = deriveCouponsFromAdminNodes([
    {
      codeDiscount: {
        status: 'ACTIVE',
        title: '10% Off First Order',
        codes: { nodes: [{ code: 'FIRST10' }] },
        customerGets: { value: { percentage: 0.1 } },
      },
    },
    {
      codeDiscount: {
        status: 'EXPIRED',
        title: 'Old Promo',
        codes: { nodes: [{ code: 'OLD50' }] },
        customerGets: { value: { percentage: 0.5 } },
      },
    },
  ]);

  assert.deepEqual(Object.keys(coupons), ['FIRST10']);
  assert.equal(coupons.FIRST10.percentOff, 10);
});

test('mapFaqItems groups FAQs by category in sort order', () => {
  const categories = mapFaqItems([
    {
      id: '1',
      handle: 'f1',
      type: 'xmedcar_faq',
      fields: [
        { key: 'category', value: 'Orders & Shipping' },
        { key: 'question', value: 'Q2' },
        { key: 'answer', value: 'A2' },
        { key: 'sort_order', value: '2' },
      ],
    },
    {
      id: '2',
      handle: 'f2',
      type: 'xmedcar_faq',
      fields: [
        { key: 'category', value: 'Orders & Shipping' },
        { key: 'question', value: 'Q1' },
        { key: 'answer', value: 'A1' },
        { key: 'sort_order', value: '1' },
      ],
    },
  ]);

  assert.equal(categories.length, 1);
  assert.equal(categories[0].items[0].q, 'Q1');
  assert.equal(categories[0].items[1].q, 'Q2');
});

test('mapStoreSettings and mapShopifyArticle map CDN images and PKR thresholds', () => {
  const settings = mapStoreSettings(
    {
      id: 's1',
      handle: 'default',
      type: 'xmedcar_store_settings',
      fields: [
        { key: 'currency_code', value: 'PKR' },
        { key: 'free_shipping_threshold', value: '18000' },
        {
          key: 'newsletter_image',
          reference: { image: { url: 'https://cdn.shopify.com/newsletter.png' } },
        },
      ],
    },
    DEFAULT_STORE_SETTINGS
  );
  assert.equal(settings.currencyCode, 'PKR');
  assert.equal(settings.freeShippingThreshold, 18000);
  assert.equal(settings.newsletterImage, 'https://cdn.shopify.com/newsletter.png');

  const article = mapShopifyArticle({
    id: 'gid://shopify/Article/1',
    handle: 'daily-supplements',
    title: 'Daily Supplements Guide',
    publishedAt: '2026-05-08T12:00:00Z',
    excerpt: '<p>Short summary</p>',
    contentHtml: '<p>Para 1</p><p>Para 2</p>',
    tags: ['VITAMINS'],
    authorV2: { name: 'Dr. Ayesha' },
    image: { url: 'https://cdn.shopify.com/blog.png' },
    metafields: [
      { key: 'category_label', value: 'WELLNESS' },
      { key: 'quote', value: 'Consistency matters.' },
    ],
  });
  assert.equal(article.category, 'WELLNESS');
  assert.deepEqual(article.bodyParagraphs, ['Para 1', 'Para 2']);
  assert.equal(article.image, 'https://cdn.shopify.com/blog.png');
});
