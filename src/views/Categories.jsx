import { useMemo } from "react";
import { Link } from "@/components/navigation";
import { Breadcrumb, ProductImage } from "../components/ui";
import { useSeo } from "../hooks/useSeo";
import { allCategories } from "../services/catalogService";
import { slugify } from "../utils/format";

export default function Categories() {
  useSeo({ title: "All categories", description: "Browse every StyleUp category: women, men, bags, shoes, accessories, beauty and home.", path: "/categories" });
  const cats = useMemo(() => allCategories(), []);
  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Categories", to: "/categories" }]} />
      <div className="page-head"><h1 className="h1">All categories</h1><p className="lead">Everything we make, organised the way you shop.</p></div>
      <div className="catidx">{cats.map((c) => (
        <div key={c.slug}>
          <Link to={`/${c.slug}`} className="catidx__card"><ProductImage src={c.image} alt="" sizes="(min-width: 1280px) 25vw, 50vw" name={c.name} /><span className="catidx__copy"><b>{c.name}</b><span>{c.count} products</span></span></Link>
          <div className="catidx__subs">{c.subcategories.slice(0, 5).map((s) => <Link key={s} to={`/${c.slug}/${slugify(s)}`}>{s}</Link>)}</div>
        </div>
      ))}</div>
    </div>
  );
}
