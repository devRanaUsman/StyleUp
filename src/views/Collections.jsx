import { Breadcrumb } from "../components/ui";
import { CollectionCard } from "../components/product/ProductCard";
import { useSeo } from "../hooks/useSeo";
import { COLLECTIONS } from "../data/catalog";

export default function Collections() {
  useSeo({ title: "Collections", description: "Curated StyleUp edits: The Everyday Edit, Spring Essentials, Neutral Minimalism, Weekend Getaway, Office Essentials and the Evening Edit.", path: "/collections" });
  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Collections", to: "/collections" }]} />
      <div className="page-head"><h1 className="h1">Collections</h1><p className="lead">Curated edits, handpicked for the way you live.</p></div>
      <div className="coll-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))" }}>{COLLECTIONS.map((c) => <CollectionCard key={c.slug} collection={c} />)}</div>
    </div>
  );
}
