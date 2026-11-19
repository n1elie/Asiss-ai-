import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import Providers from '@/components/Providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'AI Insurance Assistance',
  description: 'AI-powered insurance quotation assistant — find the right cover in minutes.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-icon.png' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#212121' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var m=localStorage.getItem('insurance.theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=(m==='light'||m==='dark')?m:(d?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}})();`}
        </Script>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
