import "@coinbase/onchainkit/styles.css";
import "./globals.css";
import "./theme.css";
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "./providers";
import { FarcasterSDKInit } from "./components/FarcasterSDKInit";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://like2win-miniapp.vercel.app';
  const title = 'Like2Win - Turn Farcaster Likes Into Real $DEGEN Rewards';
  const description = 'Join bi-weekly transparent raffles where every like counts. Follow @Like2Win, engage with posts, and win real $DEGEN tokens through our provably fair system powered by Chainlink VRF.';
  const imageUrl = `${baseUrl}/hero.png`;

  return {
    title: {
      default: title,
      template: '%s | Like2Win'
    },
    description,
    keywords: [
      'Farcaster', 'DEGEN', 'cryptocurrency', 'raffle', 'Web3', 'MiniKit', 
      'Coinbase', 'Base', 'social media', 'rewards', 'blockchain', 'DeFi'
    ],
    authors: [{ name: 'Like2Win Team' }],
    creator: 'Like2Win',
    publisher: 'Like2Win',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: baseUrl,
      title,
      description,
      siteName: 'Like2Win',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Like2Win - Turn Farcaster Likes Into Real $DEGEN Rewards',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@Like2Win',
      site: '@Like2Win',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || imageUrl,
        button: {
          title: `Launch Like2Win`,
          action: {
            type: "launch_frame",
            name: "Like2Win",
            url: `${baseUrl}/miniapp`,
            splashImageUrl: process.env.NEXT_PUBLIC_SPLASH_IMAGE || `${baseUrl}/splash.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#F59E0B",
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-background font-sans">
        <FarcasterSDKInit />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
