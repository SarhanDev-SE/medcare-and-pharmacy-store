import {
  BLOG_POSTS,
  FAQ_CATEGORIES,
  MEGA_MENU_COLUMNS,
  PARTNER_BRANDS,
  PRODUCTS,
  STORE_INFO,
  SUBCATEGORY_BADGES,
  TESTIMONIALS,
  TOP_CATEGORIES,
} from '@/lib/data';
import {
  COUPONS,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  usdToPkr,
} from '@/lib/store-logic';
import type {
  ActiveCoupon,
  CategoryNode,
  HeroSlide,
  Product,
  PromoBanner,
  StoreSettings,
  StorefrontData,
} from '@/lib/types';
import { getShopifyConfig, shopifyAdminQuery, shopifyStorefrontQuery } from './client';
import {
  deriveCouponsFromAdminNodes,
  mapFaqItems,
  mapHeroSlide,
  mapPromoBanner,
  mapShopifyArticle,
  mapShopifyCategory,
  mapShopifyProduct,
  mapStoreSettings,
  mapSubcategoryBadge,
  mapTestimonial,
  type RawShopifyArticle,
  type RawShopifyCollection,
  type RawShopifyMetaobject,
  type RawShopifyProduct,
} from './mappers';

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    kicker: 'CLINICAL ORAL HYGIENE',
    title: 'Daily Oral Care Essentials',
    subtitle:
      'Find oral care tools for fresher, stronger teeth and support daily long-lasting mouth health.',
    cta: 'Shop Now',
    href: '/shop?category=Medical%20Equipment',
    image: '/images/hero/oral-care-hero.png',
    bgClass: 'from-[#6D93B8] via-[#83A7C9] to-[#567C9F]',
    textDark: false,
    sortOrder: 1,
  },
  {
    id: 'slide-2',
    kicker: 'BOOST YOUR DAILY HEALTH ROUTINE',
    title: 'Essential Vitamins for Wellness',
    subtitle:
      'Shop a curated range of daily vitamins developed to boost immunity and support steady energy.',
    cta: 'Shop Now',
    href: '/shop?category=Wellness%20Products',
    image: '/images/hero/vitamins-hero.png',
    bgClass: 'from-[#EFE6DB] via-[#E8DDD0] to-[#DFD0BF]',
    textDark: true,
    sortOrder: 2,
  },
  {
    id: 'slide-3',
    kicker: 'PHARMACY FORMULATED',
    title: 'Premium Wellness Supplements',
    subtitle:
      'Enhance vitality & support your immune system with third-party tested pharmacy formulations.',
    cta: 'Shop Now',
    href: '/shop?category=Pharmacy%20Medicines',
    image: '/images/hero/supplement-capsule-hero.png',
    bgClass: 'from-[#E4EDF4] via-[#DCE6EF] to-[#CFDCE8]',
    textDark: true,
    sortOrder: 3,
  },
];

const DEFAULT_PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'dual-glucose-care',
    bannerKey: 'dual-glucose-care',
    sectionGroup: 'dual',
    kicker: 'RELIABLE DAILY MONITORING',
    title: 'Glucose & Care Essentials',
    cta: 'Shop Now',
    href: '/shop?category=Health%20Care%20Devices',
    image: '/images/hero/glucose-device.png',
    bgClass: 'bg-[#EEECD7]',
    sortOrder: 1,
  },
  {
    id: 'dual-trusted-pills',
    bannerKey: 'dual-trusted-pills',
    sectionGroup: 'dual',
    kicker: 'FOR RELIEF, CARE, AND WELLNESS',
    title: 'Trusted Pills You Can Rely On',
    cta: 'Shop Now',
    href: '/shop?category=Pharmacy%20Medicines',
    image: '/images/categories/oral-medicine.png',
    bgClass: 'bg-gradient-to-br from-[#EAF3FA] to-[#D4E6F5]',
    sortOrder: 2,
  },
  {
    id: 'split-vitamins-every-day',
    bannerKey: 'split-vitamins-every-day',
    sectionGroup: 'split-main',
    kicker: 'FOR ENERGY, IMMUNITY, AND WELLNESS',
    title: 'Vitamins That Support Every Day',
    cta: 'Shop Now',
    href: '/shop?category=Wellness%20Products',
    image: '/images/hero/vitamins-every-day.png',
    bgClass: 'bg-[#E5DFCA]',
    sortOrder: 3,
  },
  {
    id: 'tile-sonic-toothbrush',
    bannerKey: 'tile-sonic-toothbrush',
    sectionGroup: 'split-tile',
    kicker: 'View Products',
    title: 'Sonic Toothbrush',
    cta: 'View Products',
    href: '/shop?category=Medical%20Equipment',
    image: '/images/categories/sonic-toothbrush.png',
    bgClass: 'bg-[#F8F9FC]',
    sortOrder: 4,
  },
  {
    id: 'tile-oral-medicine',
    bannerKey: 'tile-oral-medicine',
    sectionGroup: 'split-tile',
    kicker: 'View Products',
    title: 'Oral Medicine',
    cta: 'View Products',
    href: '/shop?category=Pharmacy%20Medicines',
    image: '/images/categories/oral-medicine.png',
    bgClass: 'bg-[#F8F9FC]',
    sortOrder: 5,
  },
  {
    id: 'tile-health-supplements',
    bannerKey: 'tile-health-supplements',
    sectionGroup: 'split-tile',
    kicker: 'View Products',
    title: 'Health Supplements',
    cta: 'View Products',
    href: '/shop?category=Wellness%20Products',
    image: '/images/categories/health-supplements.png',
    bgClass: 'bg-[#F8F9FC]',
    sortOrder: 6,
  },
  {
    id: 'tile-medical-mask',
    bannerKey: 'tile-medical-mask',
    sectionGroup: 'split-tile',
    kicker: 'View Products',
    title: 'Medical Mask',
    cta: 'View Products',
    href: '/shop?category=First%20Aid%20%26%20Safety',
    image: '/images/categories/medical-mask.png',
    bgClass: 'bg-[#F8F9FC]',
    sortOrder: 7,
  },
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  brandName: STORE_INFO.brandName,
  shopName: process.env.SHOPIFY_SHOP_NAME || 'Xmedcar Pakistan',
  phone: '+92 21 111 963 322',
  email: 'support@xmedcar.pk',
  address: 'Clifton Block 5, Karachi, Pakistan',
  contactAddress: 'Suite 402, Clifton Medical Plaza, Karachi, Pakistan',
  hoursWeekday: '8:00am - 10:00pm PKT',
  hoursSunday: '10:00am - 6:00pm PKT',
  promoCode: STORE_INFO.promoCode,
  promoBannerText: 'Enjoy 10% Off Your First Purchase! Use Code:',
  currencyCode: 'PKR',
  country: 'Pakistan',
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  standardShippingFee: STANDARD_SHIPPING_FEE,
  newsletterImage: '/images/pages/newsletter-oral-kit.png',
  aboutImage: '/images/pages/about-pills.png',
  contactMapImage: '/images/pages/contact-map.png',
  countdownHeadline: 'Better Care, Healthier Life, Smarter Savings!',
  partnerBrands: PARTNER_BRANDS,
  megaMenuColumns: MEGA_MENU_COLUMNS,
  featuredKeywords: ['Vitamins', 'Supplements', 'Wellness', 'Health', 'Probiotics', 'Blood Pressure'],
};

function convertFallbackProductToPkr(p: Product): Product {
  return {
    ...p,
    price: usdToPkr(p.price),
    ...(p.originalPrice ? { originalPrice: usdToPkr(p.originalPrice) } : {}),
    variants: p.variants.map((v) => ({
      ...v,
      price: usdToPkr(v.price),
      ...(v.originalPrice ? { originalPrice: usdToPkr(v.originalPrice) } : {}),
    })),
  };
}

function computeBrandCounts(products: Product[]) {
  const counts = new Map<string, number>();
  for (const p of products) {
    counts.set(p.brand, (counts.get(p.brand) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
}

export function buildFallbackStorefrontData(): StorefrontData {
  const products = PRODUCTS.map(convertFallbackProductToPkr);
  return {
    source: 'fallback',
    products,
    categories: TOP_CATEGORIES,
    featuredCollections: {
      topPicks: products.slice(0, 8),
      featured: products.slice(0, 8),
      recent: products.slice(4, 7),
      bestsellers: products.slice(8, 11),
      saleOff: products.filter((p) => Boolean(p.discountPercent)),
    },
    heroSlides: DEFAULT_HERO_SLIDES,
    promoBanners: DEFAULT_PROMO_BANNERS,
    subcategoryBadges: SUBCATEGORY_BADGES.map((b, idx) => ({
      ...b,
      isPromo: Boolean(b.isPromo),
      sortOrder: idx + 1,
    })),
    blogs: BLOG_POSTS,
    faqCategories: FAQ_CATEGORIES,
    testimonials: TESTIMONIALS,
    coupons: COUPONS,
    settings: DEFAULT_STORE_SETTINGS,
    brands: computeBrandCounts(products),
  };
}

const PRODUCT_METAFIELD_IDENTIFIERS = [
  'legacy_id',
  'category',
  'subcategory',
  'is_rx',
  'is_temp_controlled',
  'is_natural',
  'is_new',
  'is_hot',
  'expiry_date',
  'medicine_type',
  'composition',
  'manufacturer',
  'manufacturer_address',
  'manufacturer_phone',
  'benefits_json',
  'uses_and_benefits',
  'dosage',
  'side_effects',
  'safety_advice',
  'subscription_eligible',
  'rating',
  'review_count',
  'sold_recently',
  'viewing_now',
  'featured_group',
  'product_type_tab',
  'colors_json',
  'reviews_json',
].map((key) => ({ namespace: 'custom', key }));

const COLLECTION_METAFIELD_IDENTIFIERS = [
  'badge',
  'subcategories_json',
  'is_top_category',
  'sort_order',
  'collection_role',
].map((key) => ({ namespace: 'custom', key }));

const ARTICLE_METAFIELD_IDENTIFIERS = [
  'category_label',
  'quote',
  'subheading',
  'subheading_paragraphs_json',
  'gallery_urls_json',
  'reviews_json',
].map((key) => ({ namespace: 'custom', key }));

const STOREFRONT_CATALOG_QUERY = `
  query StorefrontFullCatalog(
    $prodMf: [HasMetafieldsIdentifier!]!,
    $colMf: [HasMetafieldsIdentifier!]!,
    $artMf: [HasMetafieldsIdentifier!]!
  ) {
    products(first: 60) {
      nodes {
        id
        handle
        title
        description
        descriptionHtml
        vendor
        productType
        tags
        availableForSale
        images(first: 10) {
          nodes { url altText }
        }
        variants(first: 20) {
          nodes {
            id
            title
            availableForSale
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
          }
        }
        metafields(identifiers: $prodMf) {
          key
          value
          type
        }
      }
    }
    collections(first: 30) {
      nodes {
        id
        handle
        title
        image { url altText }
        products(first: 40) {
          nodes { handle }
        }
        metafields(identifiers: $colMf) {
          key
          value
          type
        }
      }
    }
    blogs(first: 5) {
      nodes {
        handle
        articles(first: 20) {
          nodes {
            id
            handle
            title
            publishedAt
            excerpt
            content
            contentHtml
            tags
            authorV2 { name }
            image { url }
            metafields(identifiers: $artMf) {
              key
              value
              type
            }
          }
        }
      }
    }
    heroSlides: metaobjects(type: "xmedcar_hero_slide", first: 20) {
      nodes {
        id handle type
        fields { key value reference { ... on MediaImage { image { url } } } }
      }
    }
    promoBanners: metaobjects(type: "xmedcar_promo_banner", first: 20) {
      nodes {
        id handle type
        fields { key value reference { ... on MediaImage { image { url } } } }
      }
    }
    storeSettings: metaobjects(type: "xmedcar_store_settings", first: 5) {
      nodes {
        id handle type
        fields { key value reference { ... on MediaImage { image { url } } } }
      }
    }
    faqs: metaobjects(type: "xmedcar_faq", first: 50) {
      nodes {
        id handle type
        fields { key value reference { ... on MediaImage { image { url } } } }
      }
    }
    testimonials: metaobjects(type: "xmedcar_testimonial", first: 20) {
      nodes {
        id handle type
        fields { key value reference { ... on MediaImage { image { url } } } }
      }
    }
    subcategoryBadges: metaobjects(type: "xmedcar_subcategory_badge", first: 20) {
      nodes {
        id handle type
        fields { key value reference { ... on MediaImage { image { url } } } }
      }
    }
  }
`;

export async function fetchActiveCouponsFromShopify(): Promise<Record<string, ActiveCoupon>> {
  const { adminToken, domain } = getShopifyConfig();
  if (!adminToken || !domain) return COUPONS;
  try {
    const data = await shopifyAdminQuery<{
      codeDiscountNodes: {
        nodes: Array<{
          codeDiscount?: {
            status?: string;
            title?: string;
            codes?: { nodes: Array<{ code: string }> };
            customerGets?: { value?: { percentage?: number } };
          };
        }>;
      };
    }>(`{
      codeDiscountNodes(first: 30) {
        nodes {
          codeDiscount {
            ... on DiscountCodeBasic {
              status
              title
              codes(first: 5) { nodes { code } }
              customerGets {
                value {
                  ... on DiscountPercentage { percentage }
                }
              }
            }
          }
        }
      }
    }`);
    const mapped = deriveCouponsFromAdminNodes(data.codeDiscountNodes.nodes);
    return Object.keys(mapped).length > 0 ? mapped : COUPONS;
  } catch (err) {
    console.warn('[Shopify Coupons] Falling back to default coupons:', err);
    return COUPONS;
  }
}

export async function getShopifyStorefrontData(): Promise<StorefrontData> {
  const config = getShopifyConfig();
  if (!config.domain || !config.storefrontToken) {
    return buildFallbackStorefrontData();
  }

  try {
    const [sfData, coupons] = await Promise.all([
      shopifyStorefrontQuery<{
        products: { nodes: RawShopifyProduct[] };
        collections: { nodes: RawShopifyCollection[] };
        blogs: { nodes: Array<{ handle: string; articles: { nodes: RawShopifyArticle[] } }> };
        heroSlides: { nodes: RawShopifyMetaobject[] };
        promoBanners: { nodes: RawShopifyMetaobject[] };
        storeSettings: { nodes: RawShopifyMetaobject[] };
        faqs: { nodes: RawShopifyMetaobject[] };
        testimonials: { nodes: RawShopifyMetaobject[] };
        subcategoryBadges: { nodes: RawShopifyMetaobject[] };
      }>(STOREFRONT_CATALOG_QUERY, {
        prodMf: PRODUCT_METAFIELD_IDENTIFIERS,
        colMf: COLLECTION_METAFIELD_IDENTIFIERS,
        artMf: ARTICLE_METAFIELD_IDENTIFIERS,
      }),
      fetchActiveCouponsFromShopify(),
    ]);

    const products = sfData.products.nodes.map(mapShopifyProduct);
    if (products.length === 0) {
      return buildFallbackStorefrontData();
    }

    const fallback = buildFallbackStorefrontData();
    const productBySlug = new Map(products.map((p) => [p.slug, p]));

    const resolveCollectionProducts = (handle: string, fallbackList: Product[]): Product[] => {
      const col = sfData.collections.nodes.find((c) => c.handle === handle);
      if (!col || !col.products?.nodes?.length) return fallbackList;
      const list = col.products.nodes
        .map((n) => productBySlug.get(n.handle))
        .filter((p): p is Product => Boolean(p));
      return list.length > 0 ? list : fallbackList;
    };

    const topCategoryCols = sfData.collections.nodes
      .filter((c) => {
        const isTop = c.metafields?.find((m) => m?.key === 'is_top_category')?.value;
        const role = c.metafields?.find((m) => m?.key === 'collection_role')?.value;
        return isTop === 'true' || role === 'category';
      })
      .sort((a, b) => {
        const sa = parseInt(a.metafields?.find((m) => m?.key === 'sort_order')?.value || '99', 10);
        const sb = parseInt(b.metafields?.find((m) => m?.key === 'sort_order')?.value || '99', 10);
        return sa - sb;
      });

    const categories: CategoryNode[] =
      topCategoryCols.length > 0
        ? topCategoryCols.map((c) => mapShopifyCategory(c, products))
        : fallback.categories;

    const heroSlides =
      sfData.heroSlides.nodes.length > 0
        ? sfData.heroSlides.nodes.map(mapHeroSlide).sort((a, b) => a.sortOrder - b.sortOrder)
        : fallback.heroSlides;

    const promoBanners =
      sfData.promoBanners.nodes.length > 0
        ? sfData.promoBanners.nodes.map(mapPromoBanner).sort((a, b) => a.sortOrder - b.sortOrder)
        : fallback.promoBanners;

    const subcategoryBadges =
      sfData.subcategoryBadges.nodes.length > 0
        ? sfData.subcategoryBadges.nodes
            .map(mapSubcategoryBadge)
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : fallback.subcategoryBadges;

    const faqCategories =
      sfData.faqs.nodes.length > 0 ? mapFaqItems(sfData.faqs.nodes) : fallback.faqCategories;

    const testimonials =
      sfData.testimonials.nodes.length > 0
        ? sfData.testimonials.nodes.map(mapTestimonial)
        : fallback.testimonials;

    const settings = mapStoreSettings(sfData.storeSettings.nodes[0], DEFAULT_STORE_SETTINGS);

    const allArticles = sfData.blogs.nodes.flatMap((b) => b.articles.nodes);
    const blogs =
      allArticles.length > 0 ? allArticles.map(mapShopifyArticle) : fallback.blogs;

    return {
      source: 'shopify',
      products,
      categories,
      featuredCollections: {
        topPicks: resolveCollectionProducts('top-picks-this-week', products.slice(0, 8)),
        featured: resolveCollectionProducts('featured-products', products.slice(0, 8)),
        recent: resolveCollectionProducts('recent-products', products.slice(4, 7)),
        bestsellers: resolveCollectionProducts('our-bestsellers', products.slice(8, 11)),
        saleOff: resolveCollectionProducts(
          'sale-off-products',
          products.filter((p) => Boolean(p.discountPercent))
        ),
      },
      heroSlides,
      promoBanners,
      subcategoryBadges,
      blogs,
      faqCategories,
      testimonials,
      coupons,
      settings,
      brands: computeBrandCounts(products),
    };
  } catch (err) {
    console.error('[Shopify Storefront] Query failed, using fallback data:', err);
    return buildFallbackStorefrontData();
  }
}
