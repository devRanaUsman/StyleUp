import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "@/components/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../ui/Icon";
import { Button, ProductImage } from "../ui";
import { uiActions } from "../../store/uiSlice";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useDebounce } from "../../hooks/useDebounce";
import { searchProducts, productUrl, allCategories } from "../../services/catalogService";
import { TRENDING_SEARCHES } from "../../data/catalog";
import { money } from "../../utils/format";
import ProductCard from "../product/ProductCard";

export default function SearchOverlay() {
  const open = useSelector((s) => s.ui.searchOpen);
  const recent = useSelector((s) => s.ui.recentSearches);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ref = useRef(null);
  const inputRef = useRef(null);
  const [q, setQ] = useState("");
  const dq = useDebounce(q, 160);
  const close = () => dispatch(uiActions.closeSearch());
  useFocusTrap(ref, open, close, { initialFocus: inputRef });
  useEffect(() => { if (open) setQ(""); }, [open]);

  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const cats = useMemo(() => allCategories(), []);
  useEffect(() => {
    const term = dq.trim();
    if (term.length < 2) { setResult(null); setSearching(false); setSearchError(""); return; }
    let alive = true;
    setSearching(true);
    setSearchError("");
    searchProducts(term, 8)
      .then((data) => { if (alive) setResult(data); })
      .catch(() => { if (alive) { setResult({ items: [], total: 0, corrected: null, categories: [] }); setSearchError("Search is temporarily unavailable. Please try again."); } })
      .finally(() => { if (alive) setSearching(false); });
    return () => { alive = false; };
  }, [dq]);

  const submit = (e) => {
    e?.preventDefault();
    const term = q.trim();
    if (!term) return;
    dispatch(uiActions.addRecentSearch(term));
    close();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };
  const goTerm = (term) => { setQ(term); dispatch(uiActions.addRecentSearch(term)); close(); navigate(`/search?q=${encodeURIComponent(term)}`); };

  if (!open) return null;
  return createPortal(
    <div className="search-ov" ref={ref} role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1}>
      <div className="search-ov__head">
        <div className="container">
          <form className="search-ov__form" role="search" onSubmit={submit}>
            <Icon name="search" size={20} className="lead" />
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input ref={inputRef} id="site-search" className="search-ov__input" type="search" placeholder="Search for products, categories or styles" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" enterKeyHint="search" />
            {q && <button type="button" className="icon-btn icon-btn--sm search-ov__clear" aria-label="Clear search" onClick={() => { setQ(""); inputRef.current?.focus(); }}><Icon name="close" size={16} /></button>}
          </form>
          <Button variant="ghost" onClick={close}>Cancel</Button>
        </div>
      </div>
      <div className="search-ov__body">
        <div className="container">
          {searching ? (
            <div className="search-ov__loading" role="status" aria-live="polite">
              <span className="search-ov__loading-spinner" aria-hidden="true" />
              <span>Searching StyleUp…</span>
            </div>
          ) : !result ? (
            <div className="search-ov__cols">
              <div>
                {recent.length > 0 && (
                  <div className="search-block">
                    <div className="search-block__title">Recent searches<button type="button" onClick={() => dispatch(uiActions.clearRecentSearches())}>Clear</button></div>
                    <div className="search-tags">{recent.map((t) => <button type="button" key={t} className="search-tag" onClick={() => goTerm(t)}><Icon name="clock" size={14} />{t}</button>)}</div>
                  </div>
                )}
                <div className="search-block">
                  <div className="search-block__title">Trending searches</div>
                  <div className="search-tags">{TRENDING_SEARCHES.map((t) => <button type="button" key={t} className="search-tag" onClick={() => goTerm(t)}><Icon name="sparkle" size={14} />{t}</button>)}</div>
                </div>
                <div className="search-block">
                  <div className="search-block__title">Popular categories</div>
                  <div className="search-cats">{cats.map((c) => <Link key={c.slug} to={`/${c.slug}`} onClick={close}>{c.name}<span>{c.count} items</span></Link>)}</div>
                </div>
              </div>
              <div className="hide-mobile">
                <div className="search-block__title">Shop by collection</div>
                <div className="search-ov__grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                  {[["The Everyday Edit", "/collections/the-everyday-edit"], ["New Arrivals", "/new-arrivals"], ["Sale", "/sale"]].map(([l, to]) => <Link key={to} to={to} className="search-cats" onClick={close}><span style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "var(--white)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 14, fontWeight: 500 }}>{l}<Icon name="arrowRight" size={16} /></span></Link>)}
                </div>
              </div>
            </div>
          ) : result.items.length === 0 ? (
            <div className="empty" style={{ paddingTop: 24 }}>
              {searchError && <p className="form-error" role="alert">{searchError}</p>}
              <div className="empty__icon"><Icon name="search" size={28} /></div>
              <h2 className="h2">No results found for "{q}"</h2>
              <p>Check the spelling, try another term, or browse a category below.</p>
              <div className="search-tags" style={{ justifyContent: "center" }}>{cats.slice(0, 5).map((c) => <Link key={c.slug} to={`/${c.slug}`} className="search-tag" onClick={close}>{c.name}</Link>)}</div>
            </div>
          ) : (
            <div className="search-ov__cols">
              <div>
                {result.corrected && <p className="small muted" style={{ marginBottom: 12 }}>Showing results for <b>{result.corrected}</b></p>}
                {result.categories.length > 0 && (
                  <div className="search-block">
                    <div className="search-block__title">Categories</div>
                    <div className="search-cats">{result.categories.map((c) => <Link key={c.path} to={c.path} onClick={close}>{c.subcategory} <span>{c.category} · {c.count}</span></Link>)}</div>
                  </div>
                )}
                <div className="search-block only-mobile">
                  <div className="search-block__title">Products</div>
                  <div className="search-results">{result.items.slice(0, 6).map((p) => (
                    <Link key={p.product_id} to={productUrl(p)} className="search-result" onClick={close}>
                      <span className="search-result__img"><ProductImage src={p.thumbnail} alt="" sizes="56px" name={p.product_name} /></span>
                      <span><span className="search-result__name">{p.product_name}</span><span className="search-result__cat">{p.category} · {p.subcategory}</span></span>
                      <span className="search-result__price">{money(p.sale_price ?? p.regular_price)}</span>
                    </Link>
                  ))}</div>
                </div>
                <div className="search-block"><Button variant="tertiary" iconRight="arrowRight" onClick={submit}>See all {result.total} results</Button></div>
              </div>
              <div className="only-desktop">
                <div className="search-ov__count"><span>{result.total} results</span></div>
                <div className="search-ov__grid">{result.items.slice(0, 8).map((p) => <div key={p.product_id} onClick={close}><ProductCard product={p} /></div>)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>, document.body);
}
