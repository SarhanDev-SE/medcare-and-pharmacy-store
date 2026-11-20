import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModalsAndDrawers from '@/components/ModalsAndDrawers';
import ChatWidget from '@/components/chat/ChatWidget';
import { getShopifyStorefrontData } from '@/lib/shopify/storefront';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Xmedcar — Online Pharmacy & Wellness Store',
  description:
    'Trusted online pharmacy and wellness storefront featuring prescription (Rx) ordering, medicine subscriptions, curated supplements, and clinical essentials across Pakistan.',
  openGraph: {
    title: 'Xmedcar — Online Pharmacy & Wellness Store',
    description:
      'Trusted online pharmacy and wellness storefront featuring prescription (Rx) ordering, medicine subscriptions, curated supplements, and clinical essentials across Pakistan.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xmedcar — Online Pharmacy & Wellness Store',
    description:
      'Trusted online pharmacy and wellness storefront featuring prescription (Rx) ordering, medicine subscriptions, curated supplements, and clinical essentials across Pakistan.',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const storeData = await getShopifyStorefrontData();

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-white text-slate-900">
        <StoreProvider initialData={storeData}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ModalsAndDrawers />
          <ChatWidget />
        </StoreProvider>
      </body>
    </html>
  );
}
