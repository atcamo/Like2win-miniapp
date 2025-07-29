import type { Metadata } from "next";
import { Providers } from "../providers";

export const metadata: Metadata = {
  title: "Like2Win Mini App",
  description: "Turn your Farcaster likes into real $DEGEN rewards",
};

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-amber-900/20">
      <Providers>
        {children}
      </Providers>
    </div>
  );
}