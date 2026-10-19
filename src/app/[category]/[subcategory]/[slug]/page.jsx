import { notFound } from 'next/navigation';
import ProductDetail from '@/views/ProductDetail';
import { catalog } from '@/server/db.mjs';

async function resolve(params) {
  const { category, subcategory, slug } = await params;
  const items = await catalog();
  return items.find(p => p.category_slug === category && p.subcategory_slug === subcategory && p.slug === slug);
}

export async function generateMetadata({ params }) {
  const p = await resolve(params);
  return p ? { title: p.product_name, description: p.short_description } : { title: 'Product not found' };
}

export default async function Page({ params }) {
  const p = await resolve(params);
  if (!p) notFound();
  return <ProductDetail key={p.product_id} initialProduct={p} />;
}