import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "@/components/navigation";
import { useDispatch } from "react-redux";
import { Breadcrumb, Button, EmptyState, Pagination, SkeletonGrid } from "../components/ui";
import { ProductGrid } from "../components/product/ProductCard";
import { useSeo } from "../hooks/useSeo";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { searchProducts, sortProducts, SORTS, PAGE_SIZE, allCategories } from "../services/catalogService";
import { uiActions } from "../store/uiSlice";

export default function SearchResults() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") || "";
  const sort = sp.get("sort") || "featured";
  const page = Number(sp.get("page") || 1);
  const desktop = useIsDesktop();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(Boolean(q));
  const [result, setResult] = useState({ items: [], total: 0, corrected: null, categories: [] });
  const [searchError, setSearchError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [shown, setShown] = useState(PAGE_SIZE);
  useSeo({ title: q ? `Search results for "${q}"` : "Search", noindex: true });
  useEffect(() => {
    setShown(PAGE_SIZE);
    if (!q) { setResult({ items: [], total: 0, corrected: null, categories: [] }); setLoading(false); setSearchError(""); return; }
    let alive = true;
    setLoading(true);
    setSearchError("");
    searchProducts(q)
      .then((data) => { if (alive) setResult(data); })
      .catch(() => { if (alive) { setResult({ items: [], total: 0, corrected: null, categories: [] }); setSearchError("We couldn't complete that search. Please try again."); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [q, retryKey]);
  useEffect(() => { setShown(PAGE_SIZE); }, [sort, page]);
  useEffect(() => { if (q) dispatch(uiActions.addRecentSearch(q)); }, [q, dispatch]);

  const sorted = useMemo(() => (sort === "featured" ? result.items : sortProducts(result.items, sort)), [result, sort]);
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const items = desktop ? sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : sorted.slice(0, shown);
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== "page") n.delete("page"); setSp(n); };
  const cats = allCategories();

  return (
    <div className="page container">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Search", to: "/search" }]} />
      <div className="page-head">
        <h1 className="h1">{q ? <>Results for "{q}"</> : "Search"}</h1>
        {q && !loading && <p className="lead">{result.corrected ? <>No exact matches — showing results for <b>{result.corrected}</b>. </> : null}{sorted.length} {sorted.length === 1 ? "product" : "products"} found.</p>}
      </div>
      {!q ? (
        <EmptyState icon="search" title="What are you looking for?" text="Search for products, categories or styles." actions={<Button onClick={() => dispatch(uiActions.openSearch())} icon="search">Open search</Button>} />
      ) : loading ? <SkeletonGrid n={8} /> : searchError ? (
        <EmptyState icon="alert" title="Search is temporarily unavailable" text={searchError} actions={<Button onClick={() => setRetryKey((x) => x + 1)}>Try again</Button>} />
      ) : sorted.length === 0 ? (
        <EmptyState icon="search" title={`No results found for "${q}"`} text="Check the spelling, try another term, or browse a category." actions={<><Button onClick={() => dispatch(uiActions.openSearch())}>Try another search</Button>{cats.slice(0, 4).map((c) => <Button key={c.slug} variant="secondary" to={`/${c.slug}`}>{c.name}</Button>)}</>} />
      ) : (
        <div className="listing" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            {result.categories.length > 0 && <div className="chips" style={{ marginBottom: 20 }}>{result.categories.map((c) => <Link key={c.path} to={c.path} className="search-tag">{c.subcategory} <span className="muted">· {c.count}</span></Link>)}</div>}
            <div className="toolbar"><span className="toolbar__count">{sorted.length} products</span><div className="toolbar__right"><div className="select-wrap"><label htmlFor="sort" className="sr-only">Sort by</label><select id="sort" className="select" value={sort} onChange={(e) => set("sort", e.target.value)}>{SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div></div></div>
            <ProductGrid products={items} />
            {desktop ? <Pagination page={page} pages={pages} onChange={(p) => { set("page", String(p)); window.scrollTo({ top: 0, behavior: "smooth" }); }} /> : shown < sorted.length && <div className="load-more"><span>Showing {items.length} of {sorted.length}</span><Button variant="secondary" onClick={() => setShown((s) => s + PAGE_SIZE)}>Load more</Button></div>}
          </div>
        </div>
      )}
    </div>
  );
}
