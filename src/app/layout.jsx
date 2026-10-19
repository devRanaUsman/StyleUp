import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import { catalog, settings, getCoupons } from '@/server/db.mjs';
import { COOKIE, userFromToken, publicUser } from '@/server/auth.mjs';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/ui.css';
import '@/styles/layout.css';
import '@/styles/product.css';
import '@/styles/pages.css';
import '@/styles/dashboard.css';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
export const metadata = { title: { default: 'StyleUp | Everything you love, all in one place', template: '%s | StyleUp' }, description: 'Shop quality fashion, accessories, beauty and home at StyleUp — everyday essentials at unbeatable prices.', icons: { icon: '/favicon.svg' } };

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  const user = publicUser(await userFromToken(token));
  const [products, storeSettings, coupons] = await Promise.all([
    catalog(),
    settings(),
    getCoupons()
  ]);

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Suspense fallback={<p className="container page">Loading StyleUp…</p>}>
          <Providers products={products} user={user} commerce={{ settings: storeSettings, coupons }}>
            {children}
          </Providers>
        </Suspense>
        <div id="overlay-root" />
      </body>
    </html>
  );
}
