export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP';

export interface ProductVariant {
  id: string;
  shopifyVariantId?: string;
  label: string;
  price: number;
  originalPrice?: number;
  inventoryQuantity?: number;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Product {
  id: string;
  shopifyId?: string;
  slug: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  isRx: boolean;
  isTempControlled?: boolean;
  isNatural?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  inStock: boolean;
  stockCount: number;
  soldRecently?: number;
  viewingNow?: number;
  expiryDate: string;
  medicineType: string;
  composition: string;
  manufacturer: string;
  manufacturerAddress: string;
  manufacturerPhone: string;
  benefits: string[];
  description: string;
  usesAndBenefits: string;
  dosage: string;
  sideEffects: string;
  safetyAdvice: string;
  variants: ProductVariant[];
  subscriptionEligible: boolean;
  colors?: string[];
  featuredGroup?: 'top-picks' | 'featured' | 'recent' | 'bestsellers' | 'sale-off';
  productTypeTab?: 'Medications' | 'Devices' | 'Wellness' | 'Offers';
  reviews: ProductReview[];
}

export interface CategoryNode {
  id: string;
  shopifyId?: string;
  slug: string;
  name: string;
  badge?: 'HOT' | 'NEW';
  image?: string;
  productCount: number;
  subcategories: string[];
}

export interface HeroSlide {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
  bgClass: string;
  textDark: boolean;
  sortOrder: number;
}

export interface PromoBanner {
  id: string;
  bannerKey: string;
  sectionGroup: 'dual' | 'split-main' | 'split-tile';
  kicker?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  href: string;
  image: string;
  bgClass: string;
  sortOrder: number;
}

export interface SubcategoryBadge {
  id: string;
  label: string;
  count: number;
  image: string;
  isPromo: boolean;
  promoLabel?: string;
  sortOrder: number;
}

export interface MegaMenuColumn {
  title: string;
  links: { label: string; query: string }[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  category: string;
  items: FaqItem[];
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
}

export interface ActiveCoupon {
  code: string;
  percentOff: number;
  description: string;
}

export interface StoreSettings {
  brandName: string;
  shopName: string;
  phone: string;
  email: string;
  address: string;
  contactAddress: string;
  hoursWeekday: string;
  hoursSunday: string;
  promoCode: string;
  promoBannerText: string;
  currencyCode: CurrencyCode;
  country: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  newsletterImage: string;
  aboutImage: string;
  contactMapImage: string;
  countdownHeadline: string;
  partnerBrands: string[];
  megaMenuColumns: MegaMenuColumn[];
  featuredKeywords: string[];
}

export interface StorefrontData {
  source: 'shopify' | 'fallback';
  products: Product[];
  categories: CategoryNode[];
  featuredCollections: {
    topPicks: Product[];
    featured: Product[];
    recent: Product[];
    bestsellers: Product[];
    saleOff: Product[];
  };
  heroSlides: HeroSlide[];
  promoBanners: PromoBanner[];
  subcategoryBadges: SubcategoryBadge[];
  blogs: BlogPost[];
  faqCategories: FaqCategory[];
  testimonials: Testimonial[];
  coupons: Record<string, ActiveCoupon>;
  settings: StoreSettings;
  brands: { name: string; count: number }[];
}

export interface CartItem {
  id: string; // unique line key (productId + variantId + purchaseMode)
  productId: string;
  shopifyVariantId?: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  isRx: boolean;
  variantLabel?: string;
  purchaseMode: 'one-time' | 'subscription';
  subscriptionIntervalDays?: 30 | 60 | 90;
}

export interface PrescriptionFileMeta {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  previewDataUrl?: string;
}

export interface OrderItemSummary {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
  isRx: boolean;
  variantLabel?: string;
  purchaseMode: 'one-time' | 'subscription';
}

export type OrderStatus = 'Processing' | 'Completed' | 'Pending payment' | 'Cancelled';

export interface Order {
  id: string;
  shopifyOrderId?: string;
  shopifyOrderUrl?: string;
  number: string; // e.g. #436
  date: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  paymentMethod: string;
  items: OrderItemSummary[];
  billingName: string;
  billingEmail: string;
  billingPhone: string;
  shippingAddress: string;
  prescriptionFile?: PrescriptionFileMeta;
  orderNotes?: string;
}

export interface PrescriptionRequest {
  id: string;
  requestNumber: string; // e.g. #417
  date: string;
  fullName: string;
  phone: string;
  status: 'Pending' | 'Converted';
  file: PrescriptionFileMeta;
  convertedOrderNumber?: string;
}

export interface MedicineSubscription {
  id: string;
  productId: string;
  productName: string;
  image: string;
  intervalDays: 30 | 60 | 90;
  quantity: number;
  pricePerCycle: number;
  nextRenewal: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  history: {
    orderNumber: string;
    label: string;
    date: string;
    status: 'Completed' | 'Processing';
  }[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
  quote: string;
  bodyParagraphs: string[];
  subheading: string;
  subheadingParagraphs: string[];
  tags: string[];
  gallery: string[];
  reviews: ProductReview[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: {
    firstName: string;
    lastName: string;
    country: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  };
}

export interface FilterState {
  categories: string[];
  subcategory: string | null;
  minPrice: number;
  maxPrice: number;
  availability: ('in-stock' | 'out-of-stock')[];
  brands: string[];
  colors: string[];
  search: string;
  sort: 'best-selling' | 'price-asc' | 'price-desc' | 'rating' | 'newest';
}

