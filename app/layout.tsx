import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ECSAD Kiosk',
  description:
    'Panelist breakfast and lunch ordering kiosk with live order status tracking and real-time kitchen fulfillment board for ECSAD defense sessions.',
  openGraph: {
    title: 'ECSAD Kiosk',
    description:
      'Order your breakfast and lunch for today’s defense session and track preparation live.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ECSAD Kiosk',
    description:
      'Panelist meal ordering kiosk and real-time kitchen fulfillment board.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${spaceGrotesk.variable}`}
    >
      <body
        className="font-sans bg-surface text-on-surface antialiased min-h-[100dvh]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
