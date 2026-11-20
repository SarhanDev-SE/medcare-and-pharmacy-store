/**
 * Idempotent migration script to provision Xmedcar Headless Store in Shopify (PKR / Pakistan).
 * Run: npx tsx scripts/migrate-shopify.ts
 */
import fs from 'node:fs';
import path from 'node:path';
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
} from '../lib/data';
import { COUPONS, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING_FEE, usdToPkr } from '../lib/store-logic';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

if (!DOMAIN || !ADMIN_TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN in .env.local');
}

const GRAPHQL_URL = `https://${DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

async function shopifyAdmin<T = Record<string, unknown>>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (!res.ok || json.errors?.length) {
    throw new Error(
      `Shopify Admin GraphQL error (${res.status}): ${JSON.stringify(json.errors ?? json)}`
    );
  }
  return json.data as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const HERO_SLIDES = [
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
  },
];

const PROMO_BANNERS = [
  {
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

interface UploadedMedia {
  id: string;
  url: string;
  localPath: string;
}

interface FilesPageData {
  files: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Array<{ id: string; alt?: string; fileStatus: string; image?: { url: string } }>;
  };
}

async function fetchExistingFiles(): Promise<Map<string, UploadedMedia>> {
  const map = new Map<string, UploadedMedia>();
  let cursor: string | null = null;
  for (let page = 0; page < 5; page++) {
    const data: FilesPageData = await shopifyAdmin<FilesPageData>(
      `query($cursor: String) {
        files(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            alt
            fileStatus
            ... on MediaImage {
              image { url }
            }
          }
        }
      }`,
      { cursor }
    );
    for (const node of data.files.nodes) {
      if (node.alt && node.image?.url && node.alt.startsWith('/images/')) {
        map.set(node.alt, { id: node.id, url: node.image.url, localPath: node.alt });
      }
    }
    if (!data.files.pageInfo.hasNextPage) break;
    cursor = data.files.pageInfo.endCursor;
  }
  return map;
}

async function uploadLocalImages(localPaths: string[]): Promise<Map<string, UploadedMedia>> {
  const uniquePaths = [...new Set(localPaths.filter((p) => p && p.startsWith('/images/')))];
  const uploaded = await fetchExistingFiles();
  const missing = uniquePaths.filter((p) => !uploaded.has(p));
  console.log(`[Media] Already on Shopify CDN: ${uploaded.size}, uploading: ${missing.length}`);

  const BATCH_SIZE = 10;
  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const stageInputs = batch.map((relPath) => {
      const absPath = path.resolve(process.cwd(), 'public', relPath.slice(1));
      const size = fs.statSync(absPath).size;
      const filename = path.basename(relPath);
      return {
        filename,
        mimeType: 'image/png',
        fileSize: String(size),
        resource: 'FILE',
        httpMethod: 'POST',
      };
    });

    const stagedData = await shopifyAdmin<{
      stagedUploadsCreate: {
        stagedTargets: Array<{
          url: string;
          resourceUrl: string;
          parameters: Array<{ name: string; value: string }>;
        }>;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(
      `mutation($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters { name value }
          }
          userErrors { field message }
        }
      }`,
      { input: stageInputs }
    );

    if (stagedData.stagedUploadsCreate.userErrors.length) {
      throw new Error(JSON.stringify(stagedData.stagedUploadsCreate.userErrors));
    }

    const fileInputs: Array<{
      alt: string;
      contentType: string;
      originalSource: string;
    }> = [];

    for (let j = 0; j < batch.length; j++) {
      const relPath = batch[j];
      const target = stagedData.stagedUploadsCreate.stagedTargets[j];
      const absPath = path.resolve(process.cwd(), 'public', relPath.slice(1));
      const buffer = fs.readFileSync(absPath);

      const formData = new FormData();
      for (const p of target.parameters) {
        formData.append(p.name, p.value);
      }
      formData.append('file', new Blob([buffer], { type: 'image/png' }), path.basename(relPath));

      const uploadRes = await fetch(target.url, {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) {
        const errBody = await uploadRes.text().catch(() => '');
        throw new Error(`POST upload failed for ${relPath}: ${uploadRes.status} ${errBody}`);
      }

      fileInputs.push({
        alt: relPath,
        contentType: 'IMAGE',
        originalSource: target.resourceUrl,
      });
    }

    const createdData = await shopifyAdmin<{
      fileCreate: {
        files: Array<{ id: string; alt: string }>;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(
      `mutation($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files { id alt }
          userErrors { field message }
        }
      }`,
      { files: fileInputs }
    );

    if (createdData.fileCreate.userErrors.length) {
      throw new Error(JSON.stringify(createdData.fileCreate.userErrors));
    }

    const createdIds = createdData.fileCreate.files.map((f) => f.id);
    for (let attempt = 0; attempt < 15; attempt++) {
      await sleep(1200);
      const pollData = await shopifyAdmin<{
        nodes: Array<{
          id: string;
          alt?: string;
          fileStatus?: string;
          image?: { url: string };
        }>;
      }>(
        `query($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on MediaImage {
              id
              alt
              fileStatus
              image { url }
            }
          }
        }`,
        { ids: createdIds }
      );
      let readyCount = 0;
      for (const n of pollData.nodes) {
        if (n?.id && n?.image?.url && n.alt) {
          uploaded.set(n.alt, { id: n.id, url: n.image.url, localPath: n.alt });
          readyCount++;
        }
      }
      if (readyCount === createdIds.length) break;
    }
    console.log(`[Media] Uploaded batch ${i / BATCH_SIZE + 1}`);
  }

  return uploaded;
}

async function ensureStorefrontToken(): Promise<string> {
  const existing = await shopifyAdmin<{
    shop: { storefrontAccessTokens: { nodes: Array<{ id: string; title: string; accessToken: string }> } };
  }>(`{ shop { storefrontAccessTokens(first: 10) { nodes { id title accessToken } } } }`);

  const found = existing.shop.storefrontAccessTokens.nodes.find((t) =>
    t.title.includes('Xmedcar')
  ) ?? existing.shop.storefrontAccessTokens.nodes[0];

  if (found) {
    console.log('[StorefrontToken] Reusing existing token:', found.title);
    return found.accessToken;
  }

  const created = await shopifyAdmin<{
    storefrontAccessTokenCreate: {
      storefrontAccessToken: { accessToken: string; title: string } | null;
      userErrors: Array<{ message: string }>;
    };
  }>(
    `mutation {
      storefrontAccessTokenCreate(input: { title: "Xmedcar Headless Storefront" }) {
        storefrontAccessToken { accessToken title }
        userErrors { message }
      }
    }`
  );
  if (!created.storefrontAccessTokenCreate.storefrontAccessToken) {
    throw new Error(JSON.stringify(created.storefrontAccessTokenCreate.userErrors));
  }
  console.log('[StorefrontToken] Created Xmedcar Headless Storefront token.');
  return created.storefrontAccessTokenCreate.storefrontAccessToken.accessToken;
}

async function ensureShippingSettingsPKR() {
  const data = await shopifyAdmin<{
    deliveryProfiles: {
      nodes: Array<{
        id: string;
        profileLocationGroups: Array<{
          locationGroup: { id: string };
          locationGroupZones: {
            nodes: Array<{
              zone: { id: string; name: string };
              methodDefinitions: {
                nodes: Array<{ id: string; name: string }>;
              };
            }>;
          };
        }>;
      }>;
    };
  }>(`{
    deliveryProfiles(first: 3) {
      nodes {
        id
        profileLocationGroups {
          locationGroup { id }
          locationGroupZones(first: 5) {
            nodes {
              zone { id name }
              methodDefinitions(first: 5) {
                nodes { id name }
              }
            }
          }
        }
      }
    }
  }`);

  const profile = data.deliveryProfiles.nodes[0];
  if (!profile) return;
  const locGroup = profile.profileLocationGroups[0];
  const zone = locGroup?.locationGroupZones.nodes[0];
  if (!zone) return;

  const hasStandard = zone.methodDefinitions.nodes.some(
    (m) => m.name === 'Standard Pharmacy Delivery (Pakistan)'
  );
  if (hasStandard) {
    console.log('[Shipping] Pakistan PKR delivery methods already configured.');
    return;
  }

  const legacyIds = zone.methodDefinitions.nodes
    .filter((m) => m.name === 'معیاری')
    .map((m) => m.id);

  await shopifyAdmin(
    `mutation($id: ID!, $profile: DeliveryProfileInput!) {
      deliveryProfileUpdate(id: $id, profile: $profile) {
        profile { id }
        userErrors { field message }
      }
    }`,
    {
      id: profile.id,
      profile: {
        methodDefinitionsToDelete: legacyIds,
        locationGroupsToUpdate: [
          {
            id: locGroup.locationGroup.id,
            zonesToUpdate: [
              {
                id: zone.zone.id,
                name: 'Pakistan Domestic',
                methodDefinitionsToCreate: [
                  {
                    name: 'Standard Pharmacy Delivery (Pakistan)',
                    active: true,
                    rateDefinition: {
                      price: { amount: STANDARD_SHIPPING_FEE, currencyCode: 'PKR' },
                    },
                    priceConditionsToCreate: [
                      {
                        operator: 'LESS_THAN_OR_EQUAL_TO',
                        criteria: { amount: FREE_SHIPPING_THRESHOLD - 1, currencyCode: 'PKR' },
                      },
                    ],
                  },
                  {
                    name: `Free Express Pharmacy Shipping (Orders Rs. ${FREE_SHIPPING_THRESHOLD.toLocaleString('en-US')}+)`,
                    active: true,
                    rateDefinition: {
                      price: { amount: 0, currencyCode: 'PKR' },
                    },
                    priceConditionsToCreate: [
                      {
                        operator: 'GREATER_THAN_OR_EQUAL_TO',
                        criteria: { amount: FREE_SHIPPING_THRESHOLD, currencyCode: 'PKR' },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    }
  );
  console.log('[Shipping] Configured Pakistan PKR shipping rates cleanly.');
}

async function ensureMetafieldDefinitions() {
  const existingData = await shopifyAdmin<{
    prod: { nodes: Array<{ key: string }> };
    col: { nodes: Array<{ key: string }> };
    art: { nodes: Array<{ key: string }> };
  }>(`{
    prod: metafieldDefinitions(ownerType: PRODUCT, first: 100) { nodes { key } }
    col: metafieldDefinitions(ownerType: COLLECTION, first: 50) { nodes { key } }
    art: metafieldDefinitions(ownerType: ARTICLE, first: 50) { nodes { key } }
  }`);

  const prodKeys = new Set(existingData.prod.nodes.map((n) => n.key));
  const colKeys = new Set(existingData.col.nodes.map((n) => n.key));
  const artKeys = new Set(existingData.art.nodes.map((n) => n.key));

  const defs: Array<{
    ownerType: 'PRODUCT' | 'COLLECTION' | 'ARTICLE';
    key: string;
    name: string;
    type: string;
  }> = [
    { ownerType: 'PRODUCT', key: 'legacy_id', name: 'Legacy Product ID', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'category', name: 'Store Category', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'subcategory', name: 'Subcategory', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'is_rx', name: 'Prescription Required (Rx)', type: 'boolean' },
    { ownerType: 'PRODUCT', key: 'is_temp_controlled', name: 'Temperature Controlled', type: 'boolean' },
    { ownerType: 'PRODUCT', key: 'is_natural', name: 'Natural Ingredients', type: 'boolean' },
    { ownerType: 'PRODUCT', key: 'is_new', name: 'New Arrival', type: 'boolean' },
    { ownerType: 'PRODUCT', key: 'is_hot', name: 'Hot Product', type: 'boolean' },
    { ownerType: 'PRODUCT', key: 'expiry_date', name: 'Expiry Date', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'medicine_type', name: 'Medicine Type', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'composition', name: 'Salt / Composition', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'manufacturer', name: 'Manufacturer Name', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'manufacturer_address', name: 'Manufacturer Address', type: 'multi_line_text_field' },
    { ownerType: 'PRODUCT', key: 'manufacturer_phone', name: 'Manufacturer Phone', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'benefits_json', name: 'Key Benefits JSON', type: 'json' },
    { ownerType: 'PRODUCT', key: 'uses_and_benefits', name: 'Uses & Benefits', type: 'multi_line_text_field' },
    { ownerType: 'PRODUCT', key: 'dosage', name: 'Dosage', type: 'multi_line_text_field' },
    { ownerType: 'PRODUCT', key: 'side_effects', name: 'Side Effects', type: 'multi_line_text_field' },
    { ownerType: 'PRODUCT', key: 'safety_advice', name: 'Safety Advice', type: 'multi_line_text_field' },
    { ownerType: 'PRODUCT', key: 'subscription_eligible', name: 'Subscription Eligible', type: 'boolean' },
    { ownerType: 'PRODUCT', key: 'rating', name: 'Customer Rating', type: 'number_decimal' },
    { ownerType: 'PRODUCT', key: 'review_count', name: 'Review Count', type: 'number_integer' },
    { ownerType: 'PRODUCT', key: 'sold_recently', name: 'Sold Recently', type: 'number_integer' },
    { ownerType: 'PRODUCT', key: 'viewing_now', name: 'Viewing Now', type: 'number_integer' },
    { ownerType: 'PRODUCT', key: 'featured_group', name: 'Featured Group', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'product_type_tab', name: 'Home Top Picks Tab', type: 'single_line_text_field' },
    { ownerType: 'PRODUCT', key: 'colors_json', name: 'Color Swatches JSON', type: 'json' },
    { ownerType: 'PRODUCT', key: 'reviews_json', name: 'Reviews JSON', type: 'json' },

    { ownerType: 'COLLECTION', key: 'badge', name: 'Category Badge (HOT/NEW)', type: 'single_line_text_field' },
    { ownerType: 'COLLECTION', key: 'subcategories_json', name: 'Subcategories JSON', type: 'json' },
    { ownerType: 'COLLECTION', key: 'is_top_category', name: 'Is Top Category', type: 'boolean' },
    { ownerType: 'COLLECTION', key: 'sort_order', name: 'Sort Order', type: 'number_integer' },
    { ownerType: 'COLLECTION', key: 'collection_role', name: 'Collection Role', type: 'single_line_text_field' },

    { ownerType: 'ARTICLE', key: 'category_label', name: 'Blog Category Label', type: 'single_line_text_field' },
    { ownerType: 'ARTICLE', key: 'quote', name: 'Pull Quote', type: 'multi_line_text_field' },
    { ownerType: 'ARTICLE', key: 'subheading', name: 'Article Subheading', type: 'single_line_text_field' },
    { ownerType: 'ARTICLE', key: 'subheading_paragraphs_json', name: 'Subheading Paragraphs JSON', type: 'json' },
    { ownerType: 'ARTICLE', key: 'gallery_urls_json', name: 'Gallery URLs JSON', type: 'json' },
    { ownerType: 'ARTICLE', key: 'reviews_json', name: 'Article Reviews JSON', type: 'json' },
  ];

  for (const def of defs) {
    const exists =
      def.ownerType === 'PRODUCT'
        ? prodKeys.has(def.key)
        : def.ownerType === 'COLLECTION'
          ? colKeys.has(def.key)
          : artKeys.has(def.key);
    if (exists) continue;

    const res = await shopifyAdmin<{
      metafieldDefinitionCreate: { userErrors: Array<{ message: string }> };
    }>(
      `mutation($definition: MetafieldDefinitionInput!) {
        metafieldDefinitionCreate(definition: $definition) {
          createdDefinition { id key }
          userErrors { message }
        }
      }`,
      {
        definition: {
          name: def.name,
          namespace: 'custom',
          key: def.key,
          type: def.type,
          ownerType: def.ownerType,
          access: { storefront: 'PUBLIC_READ' },
        },
      }
    );
    if (res.metafieldDefinitionCreate.userErrors.length) {
      console.warn(`[MetafieldDef ${def.ownerType}.${def.key}]`, res.metafieldDefinitionCreate.userErrors);
    }
  }
  console.log('[MetafieldDefinitions] Ensured all Product, Collection, Article definitions.');
}

async function ensureMetaobjectDefinitions() {
  const existing = await shopifyAdmin<{
    metaobjectDefinitions: { nodes: Array<{ type: string }> };
  }>(`{ metaobjectDefinitions(first: 50) { nodes { type } } }`);
  const existingTypes = new Set(existing.metaobjectDefinitions.nodes.map((n) => n.type));

  const definitions = [
    {
      type: 'xmedcar_hero_slide',
      name: 'Xmedcar Hero Slide',
      displayNameKey: 'title',
      fieldDefinitions: [
        { key: 'kicker', name: 'Kicker', type: 'single_line_text_field' },
        { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
        { key: 'subtitle', name: 'Subtitle', type: 'multi_line_text_field' },
        { key: 'cta_label', name: 'CTA Label', type: 'single_line_text_field' },
        { key: 'cta_href', name: 'CTA Link', type: 'single_line_text_field' },
        { key: 'image', name: 'Hero Image', type: 'file_reference' },
        { key: 'bg_class', name: 'Background Gradient Class', type: 'single_line_text_field' },
        { key: 'text_dark', name: 'Use Dark Text', type: 'boolean' },
        { key: 'sort_order', name: 'Sort Order', type: 'number_integer' },
      ],
    },
    {
      type: 'xmedcar_promo_banner',
      name: 'Xmedcar Promo Banner',
      displayNameKey: 'title',
      fieldDefinitions: [
        { key: 'banner_key', name: 'Banner Key', type: 'single_line_text_field' },
        { key: 'section_group', name: 'Section Group', type: 'single_line_text_field' },
        { key: 'kicker', name: 'Kicker / Subtitle', type: 'single_line_text_field' },
        { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
        { key: 'cta_label', name: 'CTA Label', type: 'single_line_text_field' },
        { key: 'cta_href', name: 'CTA Link', type: 'single_line_text_field' },
        { key: 'image', name: 'Banner Image', type: 'file_reference' },
        { key: 'bg_class', name: 'Background Class', type: 'single_line_text_field' },
        { key: 'sort_order', name: 'Sort Order', type: 'number_integer' },
      ],
    },
    {
      type: 'xmedcar_store_settings',
      name: 'Xmedcar Store Settings',
      displayNameKey: 'brand_name',
      fieldDefinitions: [
        { key: 'brand_name', name: 'Brand Name', type: 'single_line_text_field', required: true },
        { key: 'shop_name', name: 'Shop Name', type: 'single_line_text_field' },
        { key: 'phone', name: 'Support Phone', type: 'single_line_text_field' },
        { key: 'email', name: 'Support Email', type: 'single_line_text_field' },
        { key: 'address', name: 'Footer Address', type: 'single_line_text_field' },
        { key: 'contact_address', name: 'Contact Page Address', type: 'single_line_text_field' },
        { key: 'hours_weekday', name: 'Weekday Hours', type: 'single_line_text_field' },
        { key: 'hours_sunday', name: 'Sunday Hours', type: 'single_line_text_field' },
        { key: 'promo_code', name: 'Announcement Promo Code', type: 'single_line_text_field' },
        { key: 'promo_banner_text', name: 'Announcement Banner Text', type: 'single_line_text_field' },
        { key: 'currency_code', name: 'Currency Code', type: 'single_line_text_field' },
        { key: 'country', name: 'Country', type: 'single_line_text_field' },
        { key: 'free_shipping_threshold', name: 'Free Shipping Threshold (PKR)', type: 'number_integer' },
        { key: 'standard_shipping_fee', name: 'Standard Shipping Fee (PKR)', type: 'number_integer' },
        { key: 'newsletter_image', name: 'Newsletter Popup Image', type: 'file_reference' },
        { key: 'about_image', name: 'About Page Hero Image', type: 'file_reference' },
        { key: 'contact_map_image', name: 'Contact Map Image', type: 'file_reference' },
        { key: 'countdown_headline', name: 'Countdown Banner Headline', type: 'single_line_text_field' },
        { key: 'partner_brands_json', name: 'Partner Brands JSON', type: 'json' },
        { key: 'mega_menu_json', name: 'Mega Menu JSON', type: 'json' },
        { key: 'featured_keywords_json', name: 'Search Featured Keywords JSON', type: 'json' },
      ],
    },
    {
      type: 'xmedcar_faq',
      name: 'Xmedcar FAQ Item',
      displayNameKey: 'question',
      fieldDefinitions: [
        { key: 'category', name: 'Category', type: 'single_line_text_field', required: true },
        { key: 'question', name: 'Question', type: 'single_line_text_field', required: true },
        { key: 'answer', name: 'Answer', type: 'multi_line_text_field', required: true },
        { key: 'sort_order', name: 'Sort Order', type: 'number_integer' },
      ],
    },
    {
      type: 'xmedcar_testimonial',
      name: 'Xmedcar Testimonial',
      displayNameKey: 'name',
      fieldDefinitions: [
        { key: 'name', name: 'Customer Name', type: 'single_line_text_field', required: true },
        { key: 'location', name: 'Location', type: 'single_line_text_field' },
        { key: 'rating', name: 'Star Rating', type: 'number_integer' },
        { key: 'quote', name: 'Quote', type: 'multi_line_text_field' },
        { key: 'sort_order', name: 'Sort Order', type: 'number_integer' },
      ],
    },
    {
      type: 'xmedcar_subcategory_badge',
      name: 'Xmedcar Subcategory Badge',
      displayNameKey: 'label',
      fieldDefinitions: [
        { key: 'label', name: 'Label', type: 'single_line_text_field', required: true },
        { key: 'count', name: 'Product Count Display', type: 'number_integer' },
        { key: 'image', name: 'Badge Image', type: 'file_reference' },
        { key: 'is_promo', name: 'Is Promo Badge', type: 'boolean' },
        { key: 'promo_label', name: 'Promo Label', type: 'single_line_text_field' },
        { key: 'sort_order', name: 'Sort Order', type: 'number_integer' },
      ],
    },
  ];

  for (const def of definitions) {
    if (existingTypes.has(def.type)) continue;
    const res = await shopifyAdmin<{
      metaobjectDefinitionCreate: { userErrors: Array<{ message: string }> };
    }>(
      `mutation($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition { id type }
          userErrors { message }
        }
      }`,
      {
        definition: {
          ...def,
          access: { storefront: 'PUBLIC_READ' },
        },
      }
    );
    if (res.metaobjectDefinitionCreate.userErrors.length) {
      throw new Error(JSON.stringify(res.metaobjectDefinitionCreate.userErrors));
    }
  }
  console.log('[MetaobjectDefinitions] Ensured all 6 CMS metaobject types.');
}

async function upsertMetaobject(
  type: string,
  handle: string,
  fields: Array<{ key: string; value: string }>
) {
  const res = await shopifyAdmin<{
    metaobjectUpsert: {
      metaobject: { id: string; handle: string } | null;
      userErrors: Array<{ field: string[]; message: string }>;
    };
  }>(
    `mutation($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
      metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
        metaobject { id handle }
        userErrors { field message }
      }
    }`,
    {
      handle: { type, handle },
      metaobject: {
        fields,
      },
    }
  );
  if (res.metaobjectUpsert.userErrors.length) {
    throw new Error(`Metaobject ${type}/${handle}: ${JSON.stringify(res.metaobjectUpsert.userErrors)}`);
  }
}

async function migrateProducts(
  mediaMap: Map<string, UploadedMedia>,
  locationId: string,
  publicationId: string
): Promise<Map<string, string>> {
  const slugToProductId = new Map<string, string>();

  for (const p of PRODUCTS) {
    const tags = [
      p.category,
      p.subcategory,
      p.isRx ? 'Rx' : 'OTC',
      p.isNatural ? 'Natural' : null,
      p.isTempControlled ? 'Temp Controlled' : null,
      p.isNew ? 'New' : null,
      p.isHot ? 'Hot' : null,
      p.featuredGroup ? `group:${p.featuredGroup}` : null,
      p.productTypeTab ? `tab:${p.productTypeTab}` : null,
      ...(p.colors ?? []).map((c) => `color:${c}`),
    ].filter((t): t is string => Boolean(t));

    const imagePaths = [...new Set([p.image, ...p.gallery])];
    const files = imagePaths
      .map((rel) => {
        const uploaded = mediaMap.get(rel);
        if (!uploaded) return null;
        return {
          originalSource: uploaded.url,
          contentType: 'IMAGE',
          alt: p.name,
        };
      })
      .filter((f): f is NonNullable<typeof f> => Boolean(f));

    const variants = p.variants.map((v, idx) => {
      const pkrPrice = usdToPkr(v.price);
      const pkrCompare = v.originalPrice
        ? usdToPkr(v.originalPrice)
        : p.originalPrice && v.price === p.price
          ? usdToPkr(p.originalPrice)
          : null;

      return {
        optionValues: [{ optionName: 'Pack Size', name: v.label }],
        price: pkrPrice.toFixed(2),
        ...(pkrCompare && pkrCompare > pkrPrice ? { compareAtPrice: pkrCompare.toFixed(2) } : {}),
        sku: `${p.id.toUpperCase()}-${v.id.toUpperCase()}`,
        position: idx + 1,
        inventoryPolicy: 'DENY',
        inventoryItem: { tracked: true },
        inventoryQuantities: [
          {
            locationId,
            name: 'available',
            quantity: p.inStock ? p.stockCount : 0,
          },
        ],
      };
    });

    const metafields = [
      { namespace: 'custom', key: 'legacy_id', type: 'single_line_text_field', value: p.id },
      { namespace: 'custom', key: 'category', type: 'single_line_text_field', value: p.category },
      { namespace: 'custom', key: 'subcategory', type: 'single_line_text_field', value: p.subcategory },
      { namespace: 'custom', key: 'is_rx', type: 'boolean', value: String(Boolean(p.isRx)) },
      { namespace: 'custom', key: 'is_temp_controlled', type: 'boolean', value: String(Boolean(p.isTempControlled)) },
      { namespace: 'custom', key: 'is_natural', type: 'boolean', value: String(Boolean(p.isNatural)) },
      { namespace: 'custom', key: 'is_new', type: 'boolean', value: String(Boolean(p.isNew)) },
      { namespace: 'custom', key: 'is_hot', type: 'boolean', value: String(Boolean(p.isHot)) },
      { namespace: 'custom', key: 'expiry_date', type: 'single_line_text_field', value: p.expiryDate },
      { namespace: 'custom', key: 'medicine_type', type: 'single_line_text_field', value: p.medicineType },
      { namespace: 'custom', key: 'composition', type: 'single_line_text_field', value: p.composition },
      { namespace: 'custom', key: 'manufacturer', type: 'single_line_text_field', value: p.manufacturer },
      { namespace: 'custom', key: 'manufacturer_address', type: 'multi_line_text_field', value: p.manufacturerAddress },
      { namespace: 'custom', key: 'manufacturer_phone', type: 'single_line_text_field', value: p.manufacturerPhone },
      { namespace: 'custom', key: 'benefits_json', type: 'json', value: JSON.stringify(p.benefits) },
      { namespace: 'custom', key: 'uses_and_benefits', type: 'multi_line_text_field', value: p.usesAndBenefits },
      { namespace: 'custom', key: 'dosage', type: 'multi_line_text_field', value: p.dosage },
      { namespace: 'custom', key: 'side_effects', type: 'multi_line_text_field', value: p.sideEffects },
      { namespace: 'custom', key: 'safety_advice', type: 'multi_line_text_field', value: p.safetyAdvice },
      { namespace: 'custom', key: 'subscription_eligible', type: 'boolean', value: String(Boolean(p.subscriptionEligible)) },
      { namespace: 'custom', key: 'rating', type: 'number_decimal', value: String(p.rating) },
      { namespace: 'custom', key: 'review_count', type: 'number_integer', value: String(p.reviewCount) },
      { namespace: 'custom', key: 'sold_recently', type: 'number_integer', value: String(p.soldRecently ?? 10) },
      { namespace: 'custom', key: 'viewing_now', type: 'number_integer', value: String(p.viewingNow ?? 12) },
      { namespace: 'custom', key: 'featured_group', type: 'single_line_text_field', value: p.featuredGroup ?? 'featured' },
      { namespace: 'custom', key: 'product_type_tab', type: 'single_line_text_field', value: p.productTypeTab ?? 'Wellness' },
      { namespace: 'custom', key: 'colors_json', type: 'json', value: JSON.stringify(p.colors ?? []) },
      { namespace: 'custom', key: 'reviews_json', type: 'json', value: JSON.stringify(p.reviews ?? []) },
    ];

    const res = await shopifyAdmin<{
      productSet: {
        product: { id: string; handle: string } | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(
      `mutation($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
        productSet(input: $input, identifier: $identifier, synchronous: true) {
          product { id handle }
          userErrors { field message }
        }
      }`,
      {
        identifier: { handle: p.slug },
        input: {
          title: p.name,
          handle: p.slug,
          descriptionHtml: `<p>${p.description}</p>`,
          vendor: p.brand,
          productType: p.medicineType,
          tags,
          status: 'ACTIVE',
          files,
          productOptions: [
            {
              name: 'Pack Size',
              position: 1,
              values: p.variants.map((v) => ({ name: v.label })),
            },
          ],
          variants,
          metafields,
        },
      }
    );

    if (res.productSet.userErrors.length || !res.productSet.product) {
      throw new Error(`Product ${p.slug} failed: ${JSON.stringify(res.productSet.userErrors)}`);
    }

    const prodId = res.productSet.product.id;
    slugToProductId.set(p.slug, prodId);

    // Publish to Online Store
    await shopifyAdmin(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          userErrors { message }
        }
      }`,
      { id: prodId, input: [{ publicationId }] }
    );

    console.log(`[Product] Synced ${p.slug} -> ${usdToPkr(p.price)} PKR`);
  }

  return slugToProductId;
}

async function migrateCollections(
  mediaMap: Map<string, UploadedMedia>,
  slugToProductId: Map<string, string>,
  publicationId: string
) {
  const existingCols = await shopifyAdmin<{
    collections: { nodes: Array<{ id: string; handle: string }> };
  }>(`{ collections(first: 100) { nodes { id handle } } }`);
  const handleToColId = new Map(existingCols.collections.nodes.map((c) => [c.handle, c.id]));

  const upsertCollection = async (spec: {
    handle: string;
    title: string;
    descriptionHtml: string;
    imageUrl?: string;
    productIds: string[];
    metafields: Array<{ namespace: string; key: string; type: string; value: string }>;
  }) => {
    const existingId = handleToColId.get(spec.handle);
    const input: Record<string, unknown> = {
      ...(existingId ? { id: existingId } : {}),
      title: spec.title,
      handle: spec.handle,
      descriptionHtml: spec.descriptionHtml,
      sortOrder: 'MANUAL',
      metafields: spec.metafields,
      ...(spec.imageUrl ? { image: { src: spec.imageUrl, altText: spec.title } } : {}),
      ...(!existingId && spec.productIds.length > 0 ? { products: spec.productIds } : {}),
    };

    const mutation = existingId
      ? `mutation($input: CollectionInput!) {
          collectionUpdate(input: $input) {
            collection { id handle }
            userErrors { field message }
          }
        }`
      : `mutation($input: CollectionInput!) {
          collectionCreate(input: $input) {
            collection { id handle }
            userErrors { field message }
          }
        }`;

    const res = await shopifyAdmin<Record<string, { collection: { id: string } | null; userErrors: Array<{ message: string }> }>>(
      mutation,
      { input }
    );
    const payload = existingId ? res.collectionUpdate : res.collectionCreate;
    if (payload.userErrors.length || !payload.collection) {
      throw new Error(`Collection ${spec.handle}: ${JSON.stringify(payload.userErrors)}`);
    }
    const colId = payload.collection.id;

    // On update, ensure all target products are in collection
    if (existingId && spec.productIds.length > 0) {
      const current = await shopifyAdmin<{
        collection: { products: { nodes: Array<{ id: string }> } };
      }>(`query($id: ID!) { collection(id: $id) { products(first: 100) { nodes { id } } } }`, {
        id: colId,
      });
      const currentSet = new Set(current.collection.products.nodes.map((n) => n.id));
      const toAdd = spec.productIds.filter((id) => !currentSet.has(id));
      if (toAdd.length > 0) {
        await shopifyAdmin(
          `mutation($id: ID!, $productIds: [ID!]!) {
            collectionAddProducts(id: $id, productIds: $productIds) {
              userErrors { message }
            }
          }`,
          { id: colId, productIds: toAdd }
        );
      }
    }

    await shopifyAdmin(
      `mutation($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { message } }
      }`,
      { id: colId, input: [{ publicationId }] }
    );
    console.log(`[Collection] Synced ${spec.handle} (${spec.productIds.length} products)`);
  };

  // 10 Store Category Collections
  for (let i = 0; i < TOP_CATEGORIES.length; i++) {
    const cat = TOP_CATEGORIES[i];
    const prodIds = PRODUCTS.filter(
      (p) => p.category.toLowerCase() === cat.name.toLowerCase()
    )
      .map((p) => slugToProductId.get(p.slug))
      .filter((id): id is string => Boolean(id));

    const uploadedImg = cat.image ? mediaMap.get(cat.image)?.url : undefined;
    await upsertCollection({
      handle: cat.slug,
      title: cat.name,
      descriptionHtml: `<p>Curated ${cat.name} pharmacy and wellness products.</p>`,
      imageUrl: uploadedImg,
      productIds: prodIds,
      metafields: [
        { namespace: 'custom', key: 'badge', type: 'single_line_text_field', value: cat.badge ?? '' },
        { namespace: 'custom', key: 'subcategories_json', type: 'json', value: JSON.stringify(cat.subcategories) },
        { namespace: 'custom', key: 'is_top_category', type: 'boolean', value: 'true' },
        { namespace: 'custom', key: 'sort_order', type: 'number_integer', value: String(i + 1) },
        { namespace: 'custom', key: 'collection_role', type: 'single_line_text_field', value: 'category' },
      ],
    });
  }

  // 5 Featured Homepage Collections (so merchant can curate homepage grids in Shopify Admin)
  const curatedCollections = [
    {
      handle: 'top-picks-this-week',
      title: 'Top Picks This Week',
      products: PRODUCTS.slice(0, 8),
      role: 'top-picks',
    },
    {
      handle: 'featured-products',
      title: 'Featured Products',
      products: PRODUCTS.slice(0, 8),
      role: 'featured',
    },
    {
      handle: 'recent-products',
      title: 'Recent Products',
      products: PRODUCTS.slice(4, 7),
      role: 'recent',
    },
    {
      handle: 'our-bestsellers',
      title: 'Our BestSellers',
      products: PRODUCTS.slice(8, 11),
      role: 'bestsellers',
    },
    {
      handle: 'sale-off-products',
      title: 'Sale Off Products',
      products: PRODUCTS.filter((p) => Boolean(p.discountPercent)),
      role: 'sale-off',
    },
  ];

  for (let i = 0; i < curatedCollections.length; i++) {
    const cur = curatedCollections[i];
    const prodIds = cur.products
      .map((p) => slugToProductId.get(p.slug))
      .filter((id): id is string => Boolean(id));
    await upsertCollection({
      handle: cur.handle,
      title: cur.title,
      descriptionHtml: `<p>${cur.title} — editable in Shopify Collections.</p>`,
      productIds: prodIds,
      metafields: [
        { namespace: 'custom', key: 'is_top_category', type: 'boolean', value: 'false' },
        { namespace: 'custom', key: 'sort_order', type: 'number_integer', value: String(100 + i) },
        { namespace: 'custom', key: 'collection_role', type: 'single_line_text_field', value: cur.role },
      ],
    });
  }
}

async function migrateMetaobjects(mediaMap: Map<string, UploadedMedia>) {
  // 1. Hero Slides
  for (let i = 0; i < HERO_SLIDES.length; i++) {
    const s = HERO_SLIDES[i];
    const media = mediaMap.get(s.image);
    const fields = [
      { key: 'kicker', value: s.kicker },
      { key: 'title', value: s.title },
      { key: 'subtitle', value: s.subtitle },
      { key: 'cta_label', value: s.cta },
      { key: 'cta_href', value: s.href },
      { key: 'bg_class', value: s.bgClass },
      { key: 'text_dark', value: String(s.textDark) },
      { key: 'sort_order', value: String(i + 1) },
      ...(media ? [{ key: 'image', value: media.id }] : []),
    ];
    await upsertMetaobject('xmedcar_hero_slide', s.id, fields);
  }

  // 2. Promo Banners
  for (const b of PROMO_BANNERS) {
    const media = mediaMap.get(b.image);
    const fields = [
      { key: 'banner_key', value: b.bannerKey },
      { key: 'section_group', value: b.sectionGroup },
      { key: 'kicker', value: b.kicker },
      { key: 'title', value: b.title },
      { key: 'cta_label', value: b.cta },
      { key: 'cta_href', value: b.href },
      { key: 'bg_class', value: b.bgClass },
      { key: 'sort_order', value: String(b.sortOrder) },
      ...(media ? [{ key: 'image', value: media.id }] : []),
    ];
    await upsertMetaobject('xmedcar_promo_banner', b.bannerKey, fields);
  }

  // 3. Store Settings
  const newsMedia = mediaMap.get('/images/pages/newsletter-oral-kit.png');
  const aboutMedia = mediaMap.get('/images/pages/about-pills.png');
  const mapMedia = mediaMap.get('/images/pages/contact-map.png');
  await upsertMetaobject('xmedcar_store_settings', 'xmedcar-default', [
    { key: 'brand_name', value: STORE_INFO.brandName },
    { key: 'shop_name', value: process.env.SHOPIFY_SHOP_NAME || 'Xmedcar Pakistan' },
    { key: 'phone', value: STORE_INFO.phone },
    { key: 'email', value: STORE_INFO.email },
    { key: 'address', value: STORE_INFO.address },
    { key: 'contact_address', value: STORE_INFO.contactAddress },
    { key: 'hours_weekday', value: STORE_INFO.hoursWeekday },
    { key: 'hours_sunday', value: STORE_INFO.hoursSunday },
    { key: 'promo_code', value: STORE_INFO.promoCode },
    { key: 'promo_banner_text', value: 'Enjoy 10% Off Your First Purchase! Use Code:' },
    { key: 'currency_code', value: 'PKR' },
    { key: 'country', value: 'Pakistan' },
    { key: 'free_shipping_threshold', value: String(FREE_SHIPPING_THRESHOLD) },
    { key: 'standard_shipping_fee', value: String(STANDARD_SHIPPING_FEE) },
    { key: 'countdown_headline', value: 'Better Care, Healthier Life, Smarter Savings!' },
    { key: 'partner_brands_json', value: JSON.stringify(PARTNER_BRANDS) },
    { key: 'mega_menu_json', value: JSON.stringify(MEGA_MENU_COLUMNS) },
    {
      key: 'featured_keywords_json',
      value: JSON.stringify(['Vitamins', 'Supplements', 'Wellness', 'Health', 'Probiotics', 'Blood Pressure']),
    },
    ...(newsMedia ? [{ key: 'newsletter_image', value: newsMedia.id }] : []),
    ...(aboutMedia ? [{ key: 'about_image', value: aboutMedia.id }] : []),
    ...(mapMedia ? [{ key: 'contact_map_image', value: mapMedia.id }] : []),
  ]);

  // 4. FAQs
  let faqIdx = 1;
  for (const cat of FAQ_CATEGORIES) {
    for (const item of cat.items) {
      await upsertMetaobject('xmedcar_faq', `faq-${faqIdx}`, [
        { key: 'category', value: cat.category },
        { key: 'question', value: item.q },
        { key: 'answer', value: item.a },
        { key: 'sort_order', value: String(faqIdx) },
      ]);
      faqIdx++;
    }
  }

  // 5. Testimonials
  for (let i = 0; i < TESTIMONIALS.length; i++) {
    const t = TESTIMONIALS[i];
    await upsertMetaobject('xmedcar_testimonial', t.id, [
      { key: 'name', value: t.name },
      { key: 'location', value: t.location },
      { key: 'rating', value: String(t.rating) },
      { key: 'quote', value: t.quote },
      { key: 'sort_order', value: String(i + 1) },
    ]);
  }

  // 6. Subcategory Badges
  for (let i = 0; i < SUBCATEGORY_BADGES.length; i++) {
    const b = SUBCATEGORY_BADGES[i];
    const media = b.image ? mediaMap.get(b.image) : undefined;
    await upsertMetaobject('xmedcar_subcategory_badge', b.id, [
      { key: 'label', value: b.label },
      { key: 'count', value: String(b.count) },
      { key: 'is_promo', value: String(Boolean(b.isPromo)) },
      { key: 'promo_label', value: b.promoLabel ?? '' },
      { key: 'sort_order', value: String(i + 1) },
      ...(media ? [{ key: 'image', value: media.id }] : []),
    ]);
  }

  console.log('[Metaobjects] Synced Hero Slides, Promo Banners, Store Settings, FAQs, Testimonials, Badges.');
}

async function migrateBlogs(mediaMap: Map<string, UploadedMedia>) {
  const blogsRes = await shopifyAdmin<{
    blogs: { nodes: Array<{ id: string; handle: string; title: string }> };
  }>(`{ blogs(first: 20) { nodes { id handle title } } }`);

  let blogId =
    blogsRes.blogs.nodes.find((b) => b.handle === 'health-insights')?.id ??
    blogsRes.blogs.nodes.find((b) => b.handle === 'news')?.id;

  if (!blogId) {
    const createdBlog = await shopifyAdmin<{
      blogCreate: { blog: { id: string } | null; userErrors: Array<{ message: string }> };
    }>(
      `mutation {
        blogCreate(blog: { title: "Health Insights", handle: "health-insights", commentPolicy: AUTO_PUBLISHED }) {
          blog { id }
          userErrors { message }
        }
      }`
    );
    blogId = createdBlog.blogCreate.blog?.id;
  }

  if (!blogId) throw new Error('Could not find or create Shopify blog');

  const existingArticles = await shopifyAdmin<{
    articles: { nodes: Array<{ id: string; handle: string }> };
  }>(`{ articles(first: 50) { nodes { id handle } } }`);
  const handleToArtId = new Map(existingArticles.articles.nodes.map((a) => [a.handle, a.id]));

  for (const post of BLOG_POSTS) {
    const heroMedia = mediaMap.get(post.image);
    const galleryUrls = post.gallery
      .map((g) => mediaMap.get(g)?.url)
      .filter((u): u is string => Boolean(u));

    const bodyHtml = post.bodyParagraphs.map((p) => `<p>${p}</p>`).join('\n');
    const existingId = handleToArtId.get(post.slug);

    const articleFields = {
      title: post.title,
      handle: post.slug,
      author: { name: post.author },
      body: bodyHtml,
      summary: `<p>${post.excerpt}</p>`,
      isPublished: true,
      tags: post.tags,
      ...(heroMedia ? { image: { url: heroMedia.url, altText: post.title } } : {}),
      metafields: [
        { namespace: 'custom', key: 'category_label', type: 'single_line_text_field', value: post.category },
        { namespace: 'custom', key: 'quote', type: 'multi_line_text_field', value: post.quote },
        { namespace: 'custom', key: 'subheading', type: 'single_line_text_field', value: post.subheading },
        {
          namespace: 'custom',
          key: 'subheading_paragraphs_json',
          type: 'json',
          value: JSON.stringify(post.subheadingParagraphs),
        },
        {
          namespace: 'custom',
          key: 'gallery_urls_json',
          type: 'json',
          value: JSON.stringify(galleryUrls),
        },
        {
          namespace: 'custom',
          key: 'reviews_json',
          type: 'json',
          value: JSON.stringify(post.reviews ?? []),
        },
      ],
    };

    if (existingId) {
      const res = await shopifyAdmin<{
        articleUpdate: { userErrors: Array<{ field: string[]; message: string }> };
      }>(
        `mutation($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id handle }
            userErrors { field message }
          }
        }`,
        { id: existingId, article: articleFields }
      );
      if (res.articleUpdate.userErrors.length) {
        throw new Error(`Article ${post.slug}: ${JSON.stringify(res.articleUpdate.userErrors)}`);
      }
    } else {
      const res = await shopifyAdmin<{
        articleCreate: { userErrors: Array<{ field: string[]; message: string }> };
      }>(
        `mutation($article: ArticleCreateInput!) {
          articleCreate(article: $article) {
            article { id handle }
            userErrors { field message }
          }
        }`,
        { article: { blogId, ...articleFields } }
      );
      if (res.articleCreate.userErrors.length) {
        throw new Error(`Article ${post.slug}: ${JSON.stringify(res.articleCreate.userErrors)}`);
      }
    }
    console.log(`[Blog] Synced article ${post.slug}`);
  }
}

async function migrateDiscounts() {
  const existing = await shopifyAdmin<{
    codeDiscountNodes: {
      nodes: Array<{
        id: string;
        codeDiscount: {
          title?: string;
          codes?: { nodes: Array<{ code: string }> };
        };
      }>;
    };
  }>(`{
    codeDiscountNodes(first: 20) {
      nodes {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            title
            codes(first: 5) { nodes { code } }
          }
        }
      }
    }
  }`);

  const existingCodes = new Set(
    existing.codeDiscountNodes.nodes.flatMap(
      (n) => n.codeDiscount.codes?.nodes.map((c) => c.code.toUpperCase()) ?? []
    )
  );

  for (const coupon of Object.values(COUPONS)) {
    if (existingCodes.has(coupon.code.toUpperCase())) {
      console.log(`[Discount] Code ${coupon.code} already exists in Shopify.`);
      continue;
    }

    const res = await shopifyAdmin<{
      discountCodeBasicCreate: { userErrors: Array<{ field: string[]; message: string }> };
    }>(
      `mutation($basicCodeDiscount: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
          codeDiscountNode { id }
          userErrors { field message }
        }
      }`,
      {
        basicCodeDiscount: {
          title: `${coupon.code} — ${coupon.description}`,
          code: coupon.code,
          startsAt: '2026-01-01T00:00:00Z',
          customerSelection: { all: true },
          customerGets: {
            value: { percentage: coupon.percentOff / 100 },
            items: { all: true },
          },
          appliesOncePerCustomer: false,
        },
      }
    );

    if (res.discountCodeBasicCreate.userErrors.length) {
      throw new Error(`Discount ${coupon.code}: ${JSON.stringify(res.discountCodeBasicCreate.userErrors)}`);
    }
    console.log(`[Discount] Created Shopify code ${coupon.code} (${coupon.percentOff}% off)`);
  }
}

async function main() {
  console.log(`Starting Xmedcar Shopify Headless Migration -> ${DOMAIN} (PKR)...`);

  const baseInfo = await shopifyAdmin<{
    shop: { name: string; currencyCode: string };
    locations: { nodes: Array<{ id: string; name: string }> };
    publications: { nodes: Array<{ id: string; name: string }> };
  }>(`{
    shop { name currencyCode }
    locations(first: 5) { nodes { id name } }
    publications(first: 10) { nodes { id name } }
  }`);

  const locationId = baseInfo.locations.nodes[0]?.id;
  const onlineStorePub =
    baseInfo.publications.nodes.find((p) => p.name === 'Online Store') ??
    baseInfo.publications.nodes[0];

  if (!locationId || !onlineStorePub) {
    throw new Error('Could not resolve Shopify Location or Online Store Publication');
  }
  console.log(`[Shop] ${baseInfo.shop.name} | Currency: ${baseInfo.shop.currencyCode} | Location: ${locationId}`);

  // 1. Collect every local image referenced across products, categories, blogs, hero, banners, badges, pages
  const allLocalImages = [
    ...PRODUCTS.flatMap((p) => [p.image, ...p.gallery]),
    ...TOP_CATEGORIES.map((c) => c.image ?? '').filter(Boolean),
    ...HERO_SLIDES.map((s) => s.image),
    ...PROMO_BANNERS.map((b) => b.image),
    ...SUBCATEGORY_BADGES.map((b) => b.image).filter(Boolean),
    ...BLOG_POSTS.flatMap((b) => [b.image, ...b.gallery]),
    '/images/pages/about-pills.png',
    '/images/pages/contact-map.png',
    '/images/pages/newsletter-oral-kit.png',
  ];

  const sfToken = await ensureStorefrontToken();
  await ensureShippingSettingsPKR();
  const mediaMap = await uploadLocalImages(allLocalImages);
  await ensureMetafieldDefinitions();
  await ensureMetaobjectDefinitions();
  const slugToProductId = await migrateProducts(mediaMap, locationId, onlineStorePub.id);
  await migrateCollections(mediaMap, slugToProductId, onlineStorePub.id);
  await migrateMetaobjects(mediaMap);
  await migrateBlogs(mediaMap);
  await migrateDiscounts();

  // Save SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local if not already there
  const envPath = path.resolve(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('SHOPIFY_STOREFRONT_ACCESS_TOKEN=')) {
    fs.appendFileSync(envPath, `SHOPIFY_STOREFRONT_ACCESS_TOKEN="${sfToken}"\n`);
    console.log('[Env] Added SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local');
  }

  console.log('\nMigration completed successfully!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
