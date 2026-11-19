import type { Metadata } from 'next';
import { DM_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModalsAndDrawers from '@/components/ModalsAndDrawers';
import ChatWidget from '@/components/chat/ChatWidget';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Xmedcar — Online Pharmacy & Wellness Store',
  description:
    'Trusted online pharmacy and wellness storefront featuring prescription (Rx) ordering, medicine subscriptions, curated supplements, and clinical essentials.',
  openGraph: {
    title: 'Xmedcar — Online Pharmacy & Wellness Store',
    description:
      'Trusted online pharmacy and wellness storefront featuring prescription (Rx) ordering, medicine subscriptions, curated supplements, and clinical essentials.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xmedcar — Online Pharmacy & Wellness Store',
    description:
      'Trusted online pharmacy and wellness storefront featuring prescription (Rx) ordering, medicine subscriptions, curated supplements, and clinical essentials.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plusJakarta.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-white text-slate-900">
        <StoreProvider>
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
