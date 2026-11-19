import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartSummary,
  partitionCartItems,
  validateCouponCode,
  validatePrescriptionFile,
  filterAndSortProducts,
  transitionSubscription,
  getSubscriptionPrice,
  estimateDataUrlByteSize,
  createCapturedRxFileMeta,
  getCameraErrorMessage,
} from './store-logic';
import type { CartItem, FilterState, MedicineSubscription, Product } from './types';

const sampleCart: CartItem[] = [
  {
    id: 'vitd-one-time',
    productId: 'incite-vitamin-d3',
    slug: 'incite-nutrition-vitamin-d-5000-iu',
    name: 'Incite Nutrition Vitamin D 5000 IU',
    image: '/images/products/incite-vitamin-d3.png',
    price: 39.99,
    quantity: 1,
    isRx: false,
    variantLabel: '10 Tablet',
    purchaseMode: 'one-time',
  },
  {
    id: 'relax-sub',
    productId: 'gaia-relax-gummies',
    slug: 'gaia-herbs-relax-gummies',
    name: 'Helps maintain emotional well-being Relax Gummies',
    image: '/images/products/gaia-relax-gummies.png',
    price: 44.99,
    quantity: 1,
    isRx: true,
    variantLabel: '60 Days Supply (10% Off)',
    purchaseMode: 'subscription',
    subscriptionIntervalDays: 60,
  },
  {
    id: 'turmeric-ot',
    productId: 'gaia-turmeric-supreme',
    slug: 'gaia-herbs-turmeric-supreme-extra-strength',
    name: 'Turmeric Supreme Extra Strength',
    image: '/images/products/gaia-turmeric-supreme.png',
    price: 24.99,
    quantity: 1,
    isRx: true,
    purchaseMode: 'one-time',
  },
];

test('calculateCartSummary matches $109.97 subtotal and $90.03 to free shipping ($200 threshold)', () => {
  const summary = calculateCartSummary(sampleCart, null);
  assert.equal(summary.subtotal, 109.97);
  assert.equal(summary.amountToFreeShipping, 90.03);
  assert.equal(summary.total, 109.97);
  assert.equal(summary.hasRxItems, true);
  assert.equal(summary.itemCount, 3);
});

test('calculateCartSummary applies FIRST10 10% discount correctly', () => {
  const summary = calculateCartSummary(sampleCart, 'first10');
  assert.equal(summary.discountAmount, 11.0);
  assert.equal(summary.total, 98.97);
});

test('partitionCartItems separates regular and prescription items', () => {
  const { regularItems, prescriptionItems } = partitionCartItems(sampleCart);
  assert.equal(regularItems.length, 1);
  assert.equal(prescriptionItems.length, 2);
});

test('validateCouponCode validates known codes and rejects unknown ones', () => {
  assert.equal(validateCouponCode('first10').valid, true);
  assert.equal(validateCouponCode('SAVE15').valid, true);
  assert.equal(validateCouponCode('BADCODE').valid, false);
  assert.equal(validateCouponCode('   ').valid, false);
});

test('validatePrescriptionFile enforces allowed extensions/types and 2MB max size', () => {
  assert.equal(
    validatePrescriptionFile({ name: 'rx-scan.pdf', size: 512_000, type: 'application/pdf' }).valid,
    true
  );
  assert.equal(
    validatePrescriptionFile({ name: 'rx.png', size: 1_024_000, type: 'image/png' }).valid,
    true
  );
  assert.equal(
    validatePrescriptionFile({ name: 'script.exe', size: 1000, type: 'application/octet-stream' }).valid,
    false
  );
  assert.equal(
    validatePrescriptionFile({ name: 'huge.pdf', size: 3 * 1024 * 1024, type: 'application/pdf' }).valid,
    false
  );
});

test('getSubscriptionPrice applies 15% savings', () => {
  assert.equal(getSubscriptionPrice(49.99), 42.49);
});

test('transitionSubscription toggles ACTIVE/PAUSED/CANCELLED and updates interval', () => {
  const baseSub: MedicineSubscription = {
    id: 'sub-1',
    productId: 'p1',
    productName: 'Relax Gummies',
    image: '/img.png',
    intervalDays: 30,
    quantity: 1,
    pricePerCycle: 47.49,
    nextRenewal: 'August 15, 2026',
    status: 'ACTIVE',
    history: [],
  };
  const paused = transitionSubscription(baseSub, 'pause');
  assert.equal(paused.status, 'PAUSED');
  const resumed = transitionSubscription(paused, 'resume');
  assert.equal(resumed.status, 'ACTIVE');
  const changed = transitionSubscription(resumed, { type: 'interval', days: 90 });
  assert.equal(changed.intervalDays, 90);
  const cancelled = transitionSubscription(changed, 'cancel');
  assert.equal(cancelled.status, 'CANCELLED');
});

test('filterAndSortProducts filters by brand, price, stock, search, and sorts correctly', () => {
  const mockProducts = [
    {
      id: '1',
      slug: 'a',
      name: 'Alpha Relax',
      category: 'Vitamins',
      subcategory: 'Stomach & gut relief',
      brand: 'Glaxo SmithKline',
      price: 12.99,
      rating: 4.9,
      reviewCount: 54,
      image: '',
      gallery: [],
      isRx: true,
      inStock: true,
      stockCount: 10,
      soldRecently: 20,
      expiryDate: '2027',
      medicineType: 'Gummies',
      composition: 'Lemon Balm',
      manufacturer: 'GSK',
      manufacturerAddress: '',
      manufacturerPhone: '',
      benefits: [],
      description: '',
      usesAndBenefits: '',
      dosage: '',
      sideEffects: '',
      safetyAdvice: '',
      variants: [],
      subscriptionEligible: true,
      reviews: [],
    },
    {
      id: '2',
      slug: 'b',
      name: 'Beta Relief',
      category: 'Supplements',
      subcategory: 'Pain Relief',
      brand: 'Teva Pharmaceuticals',
      price: 49.99,
      rating: 4.5,
      reviewCount: 12,
      image: '',
      gallery: [],
      isRx: false,
      inStock: false,
      stockCount: 0,
      soldRecently: 5,
      expiryDate: '2027',
      medicineType: 'Capsule',
      composition: 'Turmeric',
      manufacturer: 'Teva',
      manufacturerAddress: '',
      manufacturerPhone: '',
      benefits: [],
      description: '',
      usesAndBenefits: '',
      dosage: '',
      sideEffects: '',
      safetyAdvice: '',
      variants: [],
      subscriptionEligible: true,
      reviews: [],
    },
  ] as Product[];

  const defaultFilter: FilterState = {
    categories: [],
    subcategory: null,
    minPrice: 0,
    maxPrice: 100,
    availability: ['in-stock'],
    brands: [],
    colors: [],
    search: '',
    sort: 'best-selling',
  };

  const res1 = filterAndSortProducts(mockProducts, defaultFilter);
  assert.equal(res1.length, 1);
  assert.equal(res1[0].id, '1');

  const res2 = filterAndSortProducts(mockProducts, {
    ...defaultFilter,
    availability: [],
    sort: 'price-desc',
  });
  assert.equal(res2[0].id, '2');
});

test('estimateDataUrlByteSize and createCapturedRxFileMeta produce valid PrescriptionFileMeta', () => {
  // "hello!" -> aGVsbG8h (8 base64 chars, 0 padding -> 6 bytes)
  assert.equal(estimateDataUrlByteSize('data:image/jpeg;base64,aGVsbG8h'), 6);
  // "hi" -> aGk= (4 base64 chars, 1 '=' padding -> 2 bytes)
  assert.equal(estimateDataUrlByteSize('data:image/jpeg;base64,aGk='), 2);
  assert.equal(estimateDataUrlByteSize('invalid'), 0);

  const fixedDate = new Date(2026, 10, 17, 9, 5, 3);
  const res = createCapturedRxFileMeta({
    dataUrl: 'data:image/jpeg;base64,aGVsbG8h',
    mimeType: 'image/jpeg',
    capturedAt: fixedDate,
  });
  assert.ok(res.fileMeta);
  assert.equal(res.fileMeta.name, 'rx-scan-20261117-090503.jpg');
  assert.equal(res.fileMeta.size, 6);
  assert.equal(res.fileMeta.type, 'image/jpeg');
  assert.equal(res.fileMeta.previewDataUrl, 'data:image/jpeg;base64,aGVsbG8h');

  const emptyRes = createCapturedRxFileMeta({
    dataUrl: 'data:image/jpeg;base64,',
    mimeType: 'image/jpeg',
    capturedAt: fixedDate,
  });
  assert.equal(emptyRes.fileMeta, undefined);
  assert.ok(emptyRes.error);
});

test('getCameraErrorMessage returns user-friendly guidance for permission and device errors', () => {
  assert.match(getCameraErrorMessage(new DOMException('Denied', 'NotAllowedError')), /denied/i);
  assert.match(getCameraErrorMessage(new DOMException('Missing', 'NotFoundError')), /no camera/i);
  assert.match(getCameraErrorMessage(new DOMException('Busy', 'NotReadableError')), /busy/i);
  assert.match(getCameraErrorMessage(new Error('Unknown')), /could not access/i);
});

