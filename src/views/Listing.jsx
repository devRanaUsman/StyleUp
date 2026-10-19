import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "@/components/navigation";
import Icon from "../components/ui/Icon";
import { Breadcrumb, Button, Checkbox, Chip, EmptyState, Pagination, SkeletonGrid } from "../components/ui";
import { Drawer } from "../components/ui/Overlays";
import { ProductGrid } from "../components/product/ProductCard";
import { useSeo, breadcrumbLd } from "../hooks/useSeo";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { listProducts, SORTS, PRICE_BUCKETS, PAGE_SIZE, subcategoryName } from "../services/catalogService";
import { categoryBySlug, collectionBySlug } from "../data/catalog";
import { slugify } from "../utils/format";
import NotFound from "./NotFound";

const MULTI = ["subcategories", "price", "size", "color", "brand"];

function parseParams(sp) {
  const f = {};
  for (const k of MULTI) { const v = sp.get(k); if (v) f[k] = v.split(","); }
  if (sp.get("rating")) f.rating = sp.get("rating");
  if (sp.get("availability")) f.availability = sp.get("availability");
  if (sp.get("new")) f.new = true;
  if (sp.get("best")) f.best = true;
  if (sp.get("sale")) f.sale = true;
  if (sp.get("category")) f.category = sp.get("category");
  return f;
}

function FilterGroup({ title, children, open: initial = true }) {
  const [open, setOpen] = useState(initial);
  const id = `fg-${slugify(title)}`;
  return (
    <div className="filter-group">
      <button type="button" className="filter-group__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>{title}<Icon name="chevronDown" size={16} /></button>
      {open && <div className="filter-group__body" id={id}>{children}</div>}
    </div>
  );
}

function Filters({ facets, filters, toggle, set, showCategory, showSub }) {
  const cats = [["women", "Women"], ["men", "Men"], ["bags", "Bags"], ["shoes", "Shoes"], ["accessories", "Accessories"], ["beauty", "Beauty"], ["home-and-living", "Home & Living"]];
  const subs = [...facets.subcategories.entries()].map(([k, n]) => { const [name, slug] = k.split("|"); return { name, slug, n }; }).sort((a, b) => a.name.localeCompare(b.name));
  const sizes = [...facets.sizes.entries()].sort((a, b) => sizeOrder(a[0]) - sizeOrder(b[0]));
  const colors = [...facets.colors.entries()].map(([k, n]) => { const [name, hex] = k.split("|"); return { name, hex, n, slug: slugify(name) }; }).sort((a, b) => b.n - a.n);
  const brands = [...facets.brands.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <div className="filters">
      {showCategory && (
        <FilterGroup title="Category">
          {cats.map(([slug, name]) => <label key={slug} className="radio"><input type="radio" name="category" checked={filters.category === slug} onChange={() => set("category", slug)} /><span className="radio__dot" /><span className="radio__label">{name}</span></label>)}
          {filters.category && <button type="button" className="applied__clear" onClick={() => set("category", null)}>All categories</button>}
        </FilterGroup>
      )}
      {showSub && subs.length > 1 && (
        <FilterGroup title="Subcategory">{subs.map((s) => <Checkbox key={s.slug} label={s.name} count={s.n} checked={filters.subcategories?.includes(s.slug) || false} onChange={() => toggle("subcategories", s.slug)} />)}</FilterGroup>
      )}
      <FilterGroup title="Price">{PRICE_BUCKETS.map((b) => <Checkbox key={b.id} label={b.label} count={facets.price.get(b.id) || 0} checked={filters.price?.includes(b.id) || false} onChange={() => toggle("price", b.id)} />)}</FilterGroup>
      {sizes.length > 0 && (
        <FilterGroup title="Size"><div className="filter-sizes">{sizes.map(([s, n]) => <button key={s} type="button" className="filter-size" aria-pressed={filters.size?.includes(s) || false} aria-label={`Size ${s} (${n})`} onClick={() => toggle("size", s)}>{s}</button>)}</div></FilterGroup>
      )}
      {colors.length > 0 && (
        <FilterGroup title="Color"><div className="filter-colors">{colors.slice(0, 14).map((c) => <Checkbox key={c.slug} className="filter-color" label={<><span className="swatch swatch--sm" style={{ "--sw": c.hex, marginRight: 8, display: "inline-block", verticalAlign: "middle" }} aria-hidden="true" />{c.name}</>} count={c.n} checked={filters.color?.includes(c.slug) || false} onChange={() => toggle("color", c.slug)} />)}</div></FilterGroup>
      )}
      {brands.length > 1 && <FilterGroup title="Brand" open={false}>{brands.map(([b, n]) => <Checkbox key={b} label={b} count={n} checked={filters.brand?.includes(slugify(b)) || false} onChange={() => toggle("brand", slugify(b))} />)}</FilterGroup>}
      <FilterGroup title="Rating" open={false}><div className="filter-stars">{[4, 3, 2].map((r) => <button key={r} type="button" className="filter-star" aria-pressed={filters.rating === String(r)} onClick={() => set("rating", filters.rating === String(r) ? null : String(r))}><span className="rating__stars" aria-hidden="true">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" size={13} style={{ fill: i < r ? "currentColor" : "none" }} />)}</span>& up</button>)}</div></FilterGroup>
      <FilterGroup title="Availability & more" open={false}>
        <Checkbox label="In stock only" checked={filters.availability === "in-stock"} onChange={() => set("availability", filters.availability === "in-stock" ? null : "in-stock")} />
        <Checkbox label="New arrivals" checked={!!filters.new} onChange={() => set("new", filters.new ? null : "1")} />
        <Checkbox label="Best sellers" checked={!!filters.best} onChange={() => set("best", filters.best ? null : "1")} />
        <Checkbox label="On sale" checked={!!filters.sale} onChange={() => set("sale", filters.sale ? null : "1")} />
      </FilterGroup>
    </div>
  );
}
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "S/M", "M/L"];
const sizeOrder = (s) => { const i = SIZE_ORDER.indexOf(s); if (i >= 0) return i; const n = parseInt(s.replace(/\D/g, ""), 10); return isNaN(n) ? 100 : 20 + n; };

export default function Listing({ mode }) {
  const params = useParams();
  const [sp, setSp] = useSearchParams();
  const desktop = useIsDesktop();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [retryKey, setRetryKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [drawer, setDrawer] = useState(false);
  const [extra, setExtra] = useState([]); // load-more pages on mobile
  const topRef = useRef(null);

  // Resolve context
  const cat = params.category ? categoryBySlug(params.category) : null;
  const subName = params.subcategory ? subcategoryName(params.category, params.subcategory) : null;
  const coll = mode === "collection" ? collectionBySlug(params.collection) : null;
  const invalid = (mode === "category" && !cat) || (mode === "subcategory" && (!cat || !subName)) || (mode === "collection" && !coll);

  const urlFilters = useMemo(() => parseParams(sp), [sp]);
  const sort = sp.get("sort") || (mode === "new" ? "newest" : mode === "best" ? "best-selling" : "featured");
  const page = Number(sp.get("page") || 1);

  const baseFilters = useMemo(() => {
    const f = { ...urlFilters };
    if (mode === "category" || mode === "subcategory") f.category = params.category;
    if (mode === "subcategory") f.subcategory = params.subcategory;
    if (mode === "new") f.new = true;
    if (mode === "best") f.best = true;
    if (mode === "sale") f.sale = true;
    if (mode === "collection") f.collection = params.collection;
    return f;
  }, [mode, params, urlFilters]);

  useEffect(() => {
    if (invalid) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    setExtra([]);
    setLoadMoreError("");
    listProducts({ filters: baseFilters, sort, page }).then((d) => alive && setState({ loading: false, data: d, error: null })).catch((e) => alive && setState({ loading: false, data: null, error: e }));
    return () => { alive = false; };
  }, [JSON.stringify(baseFilters), sort, page, invalid, retryKey]);

  const update = (mut) => { const n = new URLSearchParams(sp); mut(n); n.delete("page"); setSp(n, { replace: false }); };
  const toggle = (key, val) => update((n) => { const cur = (n.get(key) || "").split(",").filter(Boolean); const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]; if (next.length) n.set(key, next.join(",")); else n.delete(key); });
  const set = (key, val) => update((n) => (val ? n.set(key, val) : n.delete(key)));
  const clearAll = () => { const n = new URLSearchParams(); if (sp.get("sort")) n.set("sort", sp.get("sort")); setSp(n); };
  const setPage = (p) => { const n = new URLSearchParams(sp); n.set("page", String(p)); setSp(n); topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" }); };
  const loadMore = async () => {
    const next = page + Math.floor(extra.length / PAGE_SIZE) + 1;
    setLoadingMore(true);
    setLoadMoreError("");
    try { const d = await listProducts({ filters: baseFilters, sort, page: next }); setExtra((x) => [...x, ...d.items]); }
    catch { setLoadMoreError("We couldn't load more products. Please try again."); }
    finally { setLoadingMore(false); }
  };

  // Title / breadcrumb / SEO
  const title = mode === "all" ? "Shop All" : mode === "new" ? "New Arrivals" : mode === "best" ? "Best Sellers" : mode === "sale" ? "Sale" : mode === "collection" ? coll?.name : mode === "subcategory" ? `${cat?.name === "Women" || cat?.name === "Men" ? `${cat.name}'s ` : ""}${subName}` : cat?.name;
  const intro = mode === "all" ? "Every piece in one place — dresses, tailoring, bags, shoes, beauty and home, all designed to work together." : mode === "new" ? "The latest additions to the StyleUp edit, from new-season tailoring to everyday essentials." : mode === "best" ? "The pieces our community keeps coming back to." : mode === "sale" ? "Selected styles at up to 40% off. Same quality, for less." : mode === "collection" ? coll?.description : mode === "subcategory" ? `${subName} from StyleUp — ${cat?.intro}` : cat?.intro;
  const crumbs = [{ label: "Home", to: "/" }];
  if (mode === "all") crumbs.push({ label: "Shop All", to: "/shop" });
  else if (mode === "collection") { crumbs.push({ label: "Collections", to: "/collections" }, { label: coll?.name || "", to: `/collections/${params.collection}` }); }
  else if (mode === "category") crumbs.push({ label: cat?.name || "", to: `/${params.category}` });
  else if (mode === "subcategory") crumbs.push({ label: cat?.name || "", to: `/${params.category}` }, { label: subName || "", to: `/${params.category}/${params.subcategory}` });
  else crumbs.push({ label: title, to: `/${mode === "new" ? "new-arrivals" : mode === "best" ? "best-sellers" : "sale"}` });
  useSeo({ title: invalid ? "Not found" : title, description: intro, path: crumbs[crumbs.length - 1].to, jsonLd: invalid ? undefined : breadcrumbLd(crumbs) });

  if (invalid) return <NotFound />;

  const applied = [];
  for (const [k, v] of Object.entries(urlFilters)) {
    if (MULTI.includes(k)) for (const x of v) applied.push({ key: k, val: x, label: k === "price" ? PRICE_BUCKETS.find((b) => b.id === x)?.label : k === "subcategories" ? x.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : x.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) });
    else if (k === "rating") applied.push({ key: k, label: `${v}★ & up` });
    else if (k === "availability") applied.push({ key: k, label: "In stock" });
    else if (k === "category") applied.push({ key: k, label: categoryBySlug(v)?.name || v });
    else applied.push({ key: k, label: { new: "New arrivals", best: "Best sellers", sale: "On sale" }[k] });
  }
  const remove = (a) => (a.val ? toggle(a.key, a.val) : set(a.key, null));
  const { data, loading, error } = state;
  const items = data ? [...data.items, ...extra] : [];
  const showCategory = ["all", "new", "best", "sale", "collection"].includes(mode);
  const showSub = ["category", "all", "new", "best", "sale", "collection"].includes(mode);

  const subLinks = mode === "category" && cat ? cat.subcategories : null;

  return (
    <div className="page container">
      <Breadcrumb items={crumbs} />
      <div className="page-head" ref={topRef}>
        <h1 className="h1">{title}</h1>
        <p className="lead">{intro}</p>
        {subLinks && <div className="chips" style={{ marginTop: 16 }}>{subLinks.map((s) => <Link key={s} to={`/${cat.slug}/${slugify(s)}`} className="search-tag">{s}</Link>)}</div>}
      </div>

      <div className="listing">
        <aside className="listing__side" aria-label="Filters">{data && <Filters facets={data.facets} filters={urlFilters} toggle={toggle} set={set} showCategory={showCategory} showSub={showSub} />}</aside>
        <div>
          <div className="toolbar">
            <span className="toolbar__count" aria-live="polite">{loading && !data ? "Loading…" : `${data?.total ?? 0} ${data?.total === 1 ? "product" : "products"}`}</span>
            <div className="toolbar__right">
              <Button variant="secondary" size="sm" className="toolbar__filter-btn" icon="sliders" onClick={() => setDrawer(true)} aria-haspopup="dialog">Filter{applied.length ? ` (${applied.length})` : ""}</Button>
              <div className="select-wrap"><label htmlFor="sort" className="sr-only">Sort by</label><select id="sort" className="select" value={sort} onChange={(e) => set("sort", e.target.value)}>{SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            </div>
          </div>
          {applied.length > 0 && <div className="applied"><div className="chips">{applied.map((a, i) => <Chip key={i} label={a.label} onRemove={() => remove(a)} />)}</div><button type="button" className="applied__clear" onClick={clearAll}>Clear all</button></div>}

          {error ? <EmptyState icon="alert" title="We couldn't load these products." text="Check your connection and try again." actions={<Button onClick={() => setRetryKey((x) => x + 1)}>Try again</Button>} />
            : loading && !data ? <SkeletonGrid n={8} />
            : items.length === 0 ? <EmptyState icon="search" title={applied.length ? "No products match those filters." : "Nothing here yet."} text={applied.length ? "Try removing a filter or two to see more results." : "New pieces are added every week — in the meantime, explore what's popular."} actions={applied.length ? <Button onClick={clearAll}>Clear filters</Button> : <><Button to="/best-sellers">Best sellers</Button><Button variant="secondary" to="/shop">Shop all</Button></>} />
            : (
              <>
                <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 150ms" }}><ProductGrid products={items} /></div>
                {desktop ? <Pagination page={data.page} pages={data.pages} onChange={setPage} /> : (
                  data.pages > 1 && (
                    <div className="load-more">
                      <span>Showing {Math.min(items.length + (page - 1) * PAGE_SIZE, data.total)} of {data.total}</span>
                      <div className="progress"><div className="progress__bar" style={{ width: `${(Math.min(items.length + (page - 1) * PAGE_SIZE, data.total) / data.total) * 100}%` }} /></div>
                      {loadMoreError && <span className="form-error" role="alert">{loadMoreError}</span>}{page + extra.length / PAGE_SIZE < data.pages && <Button variant="secondary" loading={loadingMore} onClick={loadMore}>Load more</Button>}
                    </div>
                  )
                )}
              </>
            )}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" side={desktop ? "right" : "bottom"} footer={<div className="row"><Button variant="secondary" block onClick={clearAll}>Clear all</Button><Button block onClick={() => setDrawer(false)}>Show {data?.total ?? ""} results</Button></div>}>
        {data && <Filters facets={data.facets} filters={urlFilters} toggle={toggle} set={set} showCategory={showCategory} showSub={showSub} />}
      </Drawer>
    </div>
  );
}
