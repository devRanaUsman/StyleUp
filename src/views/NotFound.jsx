import { useMemo } from "react";
import { Button } from "../components/ui";
import { ProductGrid } from "../components/product/ProductCard";
import { useSeo } from "../hooks/useSeo";
import { popularProducts } from "../services/catalogService";

export default function NotFound() {
  useSeo({ title: "Page not found", noindex: true });
  const popular = useMemo(() => popularProducts(4), []);
  return (
    <div className="page container">
      <div className="nf">
        <div className="nf__code" aria-hidden="true">404</div>
        <h1 className="h1">Looks like this style slipped away.</h1>
        <p>The page you're looking for couldn't be found. It may have moved, or the link might be out of date.</p>
        <div className="empty__actions"><Button to="/shop">Continue Shopping</Button><Button variant="secondary" to="/">Back Home</Button></div>
      </div>
      <h2 className="h3" style={{ marginBottom: 20 }}>Popular right now</h2>
      <ProductGrid products={popular} />
    </div>
  );
}
