import {
  ActiveCoupon,
  BlogPost,
  CategoryNode,
  HeroSlide,
  MegaMenuColumn,
  Product,
  ProductReview,
  ProductVariant,
  PromoBanner,
  StoreSettings,
  SubcategoryBadge,
  FaqCategory,
  Testimonial,
} from '@/lib/types';
import { FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE } from '@/lib/store-logic';

export interface RawMetafieldNode {
  key: string;
  value?: string | null;
  type?: string;
}

export interface RawShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  vendor: string;
  productType: string;
  tags: string[];
  availableForSale?: boolean;
  totalInventory?: number;
  images?: { nodes: Array<{ url: string; altText?: string | null }> };
  variants?: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale?: boolean;
      quantityAvailable?: number | null;
      price: { amount: string; currencyCode: string };
      compareAtPrice?: { amount: string; currencyCode: string } | null;
    }>;
  };
  metafields?: Array<RawMetafieldNode | null>;
}

export interface RawShopifyCollection {
  id: string;
  handle: string;
  title: string;
  image?: { url: string; altText?: string | null } | null;
  products?: { nodes: Array<{ handle: string }> };
  metafields?: Array<RawMetafieldNode | null>;
}

export interface RawShopifyMetaobject {
  id: string;
  handle: string;
  type: string;
  fields: Array<{
    key: string;
    value?: string | null;
    reference?: {
      image?: { url: string } | null;
    } | null;
  }>;
}

export interface RawShopifyArticle {
  id: string;
  handle: string;
  title: string;
  publishedAt: string;
  excerpt?: string | null;
  content?: string | null;
  contentHtml?: string | null;
  tags: string[];
  authorV2?: { name?: string | null } | null;
  image?: { url: string } | null;
  metafields?: Array<RawMetafieldNode | null>;
}

function mfMap(metafields?: Array<RawMetafieldNode | null>): Map<string, string> {
  const map = new Map<string, string>();
  if (!metafields) return map;
  for (const mf of metafields) {
    if (mf && mf.key && typeof mf.value === 'string') {
      map.set(mf.key, mf.value);
    }
  }
  return map;
}

function fieldMap(fields: RawShopifyMetaobject['fields']) {
  const values = new Map<string, string>();
  const images = new Map<string, string>();
  for (const f of fields) {
    if (typeof f.value === 'string') values.set(f.key, f.value);
    if (f.reference?.image?.url) images.set(f.key, f.reference.image.url);
  }
  return { values, images };
}

function safeJsonParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export function mapShopifyProduct(raw: RawShopifyProduct): Product {
  const mf = mfMap(raw.metafields);
  const galleryUrls = (raw.images?.nodes ?? []).map((n) => n.url).filter(Boolean);
  const primaryImage = galleryUrls[0] ?? '/images/products/incite-vitamin-d3.png';

  const variantNodes = raw.variants?.nodes ?? [];
  const variants: ProductVariant[] = variantNodes.map((v, idx) => {
    const priceNum = Math.round(parseFloat(v.price.amount) || 0);
    const compareNum = v.compareAtPrice?.amount ? Math.round(parseFloat(v.compareAtPrice.amount)) : undefined;
    return {
      id: v.id.split('/').pop() ?? `v-${idx}`,
      shopifyVariantId: v.id,
      label: v.title === 'Default Title' ? 'Standard Pack' : v.title,
      price: priceNum,
      ...(compareNum && compareNum > priceNum ? { originalPrice: compareNum } : {}),
      inventoryQuantity: typeof v.quantityAvailable === 'number' ? v.quantityAvailable : undefined,
    };
  });

  const primaryVariant = variants[0];
  const price = primaryVariant?.price ?? 0;
  const originalPrice = primaryVariant?.originalPrice;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined;

  const variantStock = variantNodes.reduce(
    (sum, v) => sum + (typeof v.quantityAvailable === 'number' ? v.quantityAvailable : 0),
    0
  );
  const stockCount =
    typeof raw.totalInventory === 'number'
      ? raw.totalInventory
      : variantStock > 0
        ? variantStock
        : raw.availableForSale === false
          ? 0
          : 40;

  const colorsFromMf = safeJsonParse<string[]>(mf.get('colors_json'), []);
  const colorsFromTags = raw.tags
    .filter((t) => t.startsWith('color:'))
    .map((t) => t.replace('color:', '').trim());
  const colors = colorsFromMf.length > 0 ? colorsFromMf : colorsFromTags.length > 0 ? colorsFromTags : undefined;

  const featuredTag = raw.tags.find((t) => t.startsWith('group:'))?.replace('group:', '');
  const featuredGroup = (mf.get('featured_group') || featuredTag) as Product['featuredGroup'];

  const tabTag = raw.tags.find((t) => t.startsWith('tab:'))?.replace('tab:', '');
  const productTypeTab = (mf.get('product_type_tab') || tabTag || 'Wellness') as Product['productTypeTab'];

  const benefits = safeJsonParse<string[]>(mf.get('benefits_json'), []);
  const reviews = safeJsonParse<ProductReview[]>(mf.get('reviews_json'), []);

  const isRx = mf.get('is_rx') === 'true' || raw.tags.includes('Rx');
  const isTempControlled =
    mf.get('is_temp_controlled') === 'true' || raw.tags.includes('Temp Controlled');
  const isNatural = mf.get('is_natural') === 'true' || raw.tags.includes('Natural');
  const isNew = mf.get('is_new') === 'true' || raw.tags.includes('New');
  const isHot = mf.get('is_hot') === 'true' || raw.tags.includes('Hot');

  const descriptionText =
    raw.description?.trim() || (raw.descriptionHtml ? stripHtml(raw.descriptionHtml) : '');

  return {
    id: mf.get('legacy_id') || raw.id.split('/').pop() || raw.handle,
    shopifyId: raw.id,
    slug: raw.handle,
    name: raw.title,
    category: mf.get('category') || 'Wellness Products',
    subcategory: mf.get('subcategory') || raw.productType || 'Daily Wellness',
    brand: raw.vendor || 'Xmedcar Pharmacy',
    price,
    ...(originalPrice ? { originalPrice } : {}),
    ...(discountPercent ? { discountPercent } : {}),
    rating: parseFloat(mf.get('rating') || '4.8') || 4.8,
    reviewCount: parseInt(mf.get('review_count') || String(reviews.length || 12), 10) || 12,
    image: primaryImage,
    gallery: galleryUrls.length > 0 ? galleryUrls : [primaryImage],
    isRx,
    isTempControlled,
    isNatural,
    isNew,
    isHot,
    inStock: raw.availableForSale !== undefined ? raw.availableForSale : stockCount > 0,
    stockCount,
    soldRecently: parseInt(mf.get('sold_recently') || '12', 10) || 12,
    viewingNow: parseInt(mf.get('viewing_now') || '14', 10) || 14,
    expiryDate: mf.get('expiry_date') || 'December 2027',
    medicineType: mf.get('medicine_type') || raw.productType || 'Wellness Supplement',
    composition: mf.get('composition') || 'Clinically Formulated Pharmacy Blend',
    manufacturer: mf.get('manufacturer') || raw.vendor || 'Xmedcar Labs',
    manufacturerAddress: mf.get('manufacturer_address') || 'Karachi & Lahore GMP Logistics Hub',
    manufacturerPhone: mf.get('manufacturer_phone') || '+92 21 111 963 322',
    benefits,
    description: descriptionText,
    usesAndBenefits: mf.get('uses_and_benefits') || descriptionText,
    dosage: mf.get('dosage') || 'Follow label instructions or physician guidance.',
    sideEffects: mf.get('side_effects') || 'Generally well tolerated when used as directed.',
    safetyAdvice: mf.get('safety_advice') || 'Keep out of reach of children. Store in a cool, dry place.',
    variants:
      variants.length > 0
        ? variants
        : [{ id: 'default', label: 'Standard Pack', price }],
    subscriptionEligible: mf.get('subscription_eligible') !== 'false',
    ...(colors ? { colors } : {}),
    featuredGroup,
    productTypeTab,
    reviews,
  };
}

export function mapShopifyCategory(
  raw: RawShopifyCollection,
  products: Product[]
): CategoryNode {
  const mf = mfMap(raw.metafields);
  const badgeVal = mf.get('badge');
  const badge = badgeVal === 'HOT' || badgeVal === 'NEW' ? badgeVal : undefined;
  const subcategories = safeJsonParse<string[]>(mf.get('subcategories_json'), []);
  const handleCount = raw.products?.nodes?.length;
  const fallbackCount = products.filter(
    (p) => p.category.toLowerCase() === raw.title.toLowerCase()
  ).length;

  return {
    id: raw.handle,
    shopifyId: raw.id,
    slug: raw.handle,
    name: raw.title,
    ...(badge ? { badge } : {}),
    ...(raw.image?.url ? { image: raw.image.url } : {}),
    productCount: handleCount && handleCount > 0 ? handleCount : fallbackCount,
    subcategories,
  };
}

export function mapHeroSlide(raw: RawShopifyMetaobject): HeroSlide {
  const { values, images } = fieldMap(raw.fields);
  return {
    id: raw.handle,
    kicker: values.get('kicker') || '',
    title: values.get('title') || '',
    subtitle: values.get('subtitle') || '',
    cta: values.get('cta_label') || 'Shop Now',
    href: values.get('cta_href') || '/shop',
    image: images.get('image') || '/images/hero/oral-care-hero.png',
    bgClass: values.get('bg_class') || 'from-[#6D93B8] via-[#83A7C9] to-[#567C9F]',
    textDark: values.get('text_dark') === 'true',
    sortOrder: parseInt(values.get('sort_order') || '1', 10) || 1,
  };
}

export function mapPromoBanner(raw: RawShopifyMetaobject): PromoBanner {
  const { values, images } = fieldMap(raw.fields);
  return {
    id: raw.handle,
    bannerKey: values.get('banner_key') || raw.handle,
    sectionGroup: (values.get('section_group') || 'dual') as PromoBanner['sectionGroup'],
    kicker: values.get('kicker') || '',
    title: values.get('title') || '',
    cta: values.get('cta_label') || 'Shop Now',
    href: values.get('cta_href') || '/shop',
    image: images.get('image') || '/images/hero/glucose-device.png',
    bgClass: values.get('bg_class') || 'bg-[#EEECD7]',
    sortOrder: parseInt(values.get('sort_order') || '1', 10) || 1,
  };
}

export function mapSubcategoryBadge(raw: RawShopifyMetaobject): SubcategoryBadge {
  const { values, images } = fieldMap(raw.fields);
  return {
    id: raw.handle,
    label: values.get('label') || '',
    count: parseInt(values.get('count') || '0', 10) || 0,
    image: images.get('image') || '',
    isPromo: values.get('is_promo') === 'true',
    promoLabel: values.get('promo_label') || undefined,
    sortOrder: parseInt(values.get('sort_order') || '1', 10) || 1,
  };
}

export function mapFaqItems(rawList: RawShopifyMetaobject[]): FaqCategory[] {
  const sorted = [...rawList].sort((a, b) => {
    const aOrder = parseInt(fieldMap(a.fields).values.get('sort_order') || '0', 10);
    const bOrder = parseInt(fieldMap(b.fields).values.get('sort_order') || '0', 10);
    return aOrder - bOrder;
  });

  const grouped = new Map<string, Array<{ q: string; a: string }>>();
  for (const raw of sorted) {
    const { values } = fieldMap(raw.fields);
    const category = values.get('category') || 'General Information';
    const q = values.get('question') || '';
    const a = values.get('answer') || '';
    if (!q || !a) continue;
    const list = grouped.get(category) ?? [];
    list.push({ q, a });
    grouped.set(category, list);
  }

  return Array.from(grouped.entries()).map(([category, items]) => ({ category, items }));
}

export function mapTestimonial(raw: RawShopifyMetaobject): Testimonial {
  const { values } = fieldMap(raw.fields);
  return {
    id: raw.handle,
    name: values.get('name') || 'Verified Customer',
    location: values.get('location') || 'Pakistan',
    rating: parseInt(values.get('rating') || '5', 10) || 5,
    quote: values.get('quote') || '',
  };
}

export function mapStoreSettings(raw: RawShopifyMetaobject | undefined, fallback: StoreSettings): StoreSettings {
  if (!raw) return fallback;
  const { values, images } = fieldMap(raw.fields);
  return {
    brandName: values.get('brand_name') || fallback.brandName,
    shopName: values.get('shop_name') || fallback.shopName,
    phone: values.get('phone') || fallback.phone,
    email: values.get('email') || fallback.email,
    address: values.get('address') || fallback.address,
    contactAddress: values.get('contact_address') || fallback.contactAddress,
    hoursWeekday: values.get('hours_weekday') || fallback.hoursWeekday,
    hoursSunday: values.get('hours_sunday') || fallback.hoursSunday,
    promoCode: values.get('promo_code') || fallback.promoCode,
    promoBannerText: values.get('promo_banner_text') || fallback.promoBannerText,
    currencyCode: (values.get('currency_code') || fallback.currencyCode) as StoreSettings['currencyCode'],
    country: values.get('country') || fallback.country,
    freeShippingThreshold:
      parseInt(values.get('free_shipping_threshold') || '', 10) || FREE_SHIPPING_THRESHOLD,
    standardShippingFee:
      parseInt(values.get('standard_shipping_fee') || '', 10) || STANDARD_SHIPPING_FEE,
    newsletterImage: images.get('newsletter_image') || fallback.newsletterImage,
    aboutImage: images.get('about_image') || fallback.aboutImage,
    contactMapImage: images.get('contact_map_image') || fallback.contactMapImage,
    countdownHeadline: values.get('countdown_headline') || fallback.countdownHeadline,
    partnerBrands: safeJsonParse<string[]>(values.get('partner_brands_json'), fallback.partnerBrands),
    megaMenuColumns: safeJsonParse<MegaMenuColumn[]>(values.get('mega_menu_json'), fallback.megaMenuColumns),
    featuredKeywords: safeJsonParse<string[]>(
      values.get('featured_keywords_json'),
      fallback.featuredKeywords
    ),
  };
}

export function mapShopifyArticle(raw: RawShopifyArticle): BlogPost {
  const mf = mfMap(raw.metafields);
  const bodyHtml = raw.contentHtml || raw.content || '';
  const bodyParagraphs = bodyHtml
    ? stripHtml(bodyHtml)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const formattedDate = raw.publishedAt
    ? new Date(raw.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'May 8, 2026';

  return {
    id: raw.id.split('/').pop() || raw.handle,
    slug: raw.handle,
    title: raw.title,
    category: mf.get('category_label') || raw.tags[0] || 'Healthcare',
    date: formattedDate,
    author: raw.authorV2?.name || 'Xmedcar Editorial',
    image: raw.image?.url || '/images/blog/blog-supplements.png',
    excerpt: raw.excerpt ? stripHtml(raw.excerpt) : bodyParagraphs[0] || '',
    quote: mf.get('quote') || '',
    bodyParagraphs,
    subheading: mf.get('subheading') || '',
    subheadingParagraphs: safeJsonParse<string[]>(mf.get('subheading_paragraphs_json'), []),
    tags: raw.tags,
    gallery: safeJsonParse<string[]>(mf.get('gallery_urls_json'), []),
    reviews: safeJsonParse<ProductReview[]>(mf.get('reviews_json'), []),
  };
}

export function deriveCouponsFromAdminNodes(
  nodes: Array<{
    codeDiscount?: {
      status?: string;
      title?: string;
      codes?: { nodes: Array<{ code: string }> };
      customerGets?: {
        value?: {
          percentage?: number;
        };
      };
    };
  }>
): Record<string, ActiveCoupon> {
  const result: Record<string, ActiveCoupon> = {};
  for (const node of nodes) {
    const cd = node.codeDiscount;
    if (!cd || (cd.status && cd.status !== 'ACTIVE')) continue;
    const pct = cd.customerGets?.value?.percentage;
    if (typeof pct !== 'number' || pct <= 0) continue;
    const percentOff = Math.round(pct * 100);
    for (const c of cd.codes?.nodes ?? []) {
      const code = c.code.trim().toUpperCase();
      if (!code) continue;
      result[code] = {
        code,
        percentOff,
        description: cd.title || `${percentOff}% off your order`,
      };
    }
  }
  return result;
}
