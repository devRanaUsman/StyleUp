import { redirect } from 'next/navigation';
import { catalog } from '@/server/db.mjs';

export default async function Page({ params }) {
  const { id } = await params;
  const items = await catalog();
  const p = items.find(p => String(p.product_id) === id || p.slug === id);
  redirect(p ? `/${p.category_slug}/${p.subcategory_slug}/${p.slug}` : '/shop');
}
