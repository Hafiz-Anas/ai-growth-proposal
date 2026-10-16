import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const arabic = IBM_Plex_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Growth Engine", template: "%s · Growth Engine" },
  description: "AI-powered Instagram growth for small businesses in Kuwait. Design proposal by Raid Technologies. All data is sample data.",
  applicationName: "Growth Engine",
  appleWebApp: { capable: true, title: "Growth Engine", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Applies the saved language, direction and theme before first paint, so there is no flash.
const preferencesScript = `(function(){try{var s=JSON.parse(localStorage.getItem('growth-engine-settings')||'{}').state||{};var d=document.documentElement;if(s.lang==='ar'){d.lang='ar';d.dir='rtl'}var t=s.theme||'light';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark');d.style.colorScheme='dark'}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${arabic.variable} antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
