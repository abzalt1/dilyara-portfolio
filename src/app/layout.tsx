import type { Metadata } from "next";
import "./out.css";

export const metadata: Metadata = {
  title: "DILYARA KUNANBAYEVA | MODEL PORTFOLIO",
  description: "Portfolio of Dilyara Kunanbayeva, a commercial model based in Almaty, Kazakhstan. Specializing in beauty, streetwear, and UGC content.",
  openGraph: {
    title: "DILYARA KUNANBAYEVA | MODEL",
    description: "Commercial model based in Almaty. Beauty, Streetwear, UGC.",
    url: "https://dilyara.kz/",
    siteName: "Dilyara Model Portfolio",
    images: [
      {
        url: "https://dilyara.kz/img/IMG_6543.JPG",
        width: 1200,
        height: 630,
        alt: "Dilyara Kunanbayeva",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DILYARA KUNANBAYEVA | MODEL",
    description: "Commercial model based in Almaty. Beauty, Streetwear, UGC.",
    images: ["https://dilyara.kz/img/IMG_6543.JPG"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <link rel="apple-touch-icon" href="/img/apple-touch-icon.png" />
        <link rel="canonical" href="https://dilyara.kz/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,500;1,500&family=Unbounded:wght@200..900&display=swap"
          rel="stylesheet"
        />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        <script src="https://identity.netlify.com/v1/netlify-identity-widget.js" async></script>
      </head>
      {/* Restored the exact original classes: bg-white text-black font-sans selection:bg-black selection:text-white bg-noise overflow-hidden */}
      <body className="bg-white text-black font-sans selection:bg-black selection:text-white bg-noise overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
