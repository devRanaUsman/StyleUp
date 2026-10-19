import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../ui/Icon";
import { ProductBadges, ProductImage } from "../ui";
import { useFocusTrap } from "../../hooks/useFocusTrap";

export default function Gallery({ product }) {
  const images = product.images;
  const video = product.video?.src ? { ...product.video, video: true, alt: product.video.alt || `${product.product_name} video` } : null;
  const slides = video ? [...images, video] : images;
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [full, setFull] = useState(false);
  const mainRef = useRef(null);
  const touch = useRef(null);
  useEffect(() => { setI(0); setZoom(false); }, [product.product_id]);
  const go = (d) => { setZoom(false); setI((x) => (x + d + slides.length) % slides.length); };
  const onTouchStart = (e) => { touch.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); touch.current = null; };
  const onMove = (e) => { if (!zoom) return; const r = mainRef.current.getBoundingClientRect(); mainRef.current.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`); mainRef.current.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`); };
  const cur = slides[i];
  const single = slides.length === 1;

  return (
    <div className="gallery">
      {!single && (
        <div className="gallery__thumbs" role="tablist" aria-label="Product images">
          {slides.map((s, k) => (
            <button key={k} type="button" role="tab" aria-selected={k === i} aria-current={k === i} className={`gallery__thumb ${s.video ? "gallery__thumb--video" : ""}`} aria-label={s.video ? "Play product video" : `View image ${k + 1}: ${s.alt}`} onClick={() => { setI(k); setZoom(false); }}>
              {s.video ? <><img src={s.poster || images[0].src} alt="" loading="lazy" /><span className="play"><Icon name="play" size={18} /></span></> : <img src={s.srcset ? s.src.replace("w=800", "w=200") : s.src} alt="" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />}
            </button>
          ))}
        </div>
      )}
      <div ref={mainRef} className={`gallery__main ${zoom ? "is-zoom" : ""}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onMouseMove={onMove} onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }} tabIndex={0} aria-roledescription="carousel" aria-label={`${product.product_name} gallery, image ${i + 1} of ${slides.length}`}>
        <div className="gallery__badges"><ProductBadges product={product} max={2} /></div>
        {cur.video ? (
          <div className="gallery__video">
            <video controls playsInline preload="metadata" poster={cur.poster || images[0]?.src} aria-label={cur.alt}>
              <source src={cur.src} type={cur.type || "video/mp4"} />
              Your browser does not support embedded product video.
            </video>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%" }} onClick={() => setZoom((z) => !z)} role="button" tabIndex={-1} aria-label={zoom ? "Zoom out" : "Zoom in"}>
            <ProductImage src={cur.src} srcSet={cur.srcset} sizes="(min-width: 1024px) 50vw, 100vw" alt={cur.alt} eager={i === 0} name={product.product_name} />
          </div>
        )}
        {!single && <><button type="button" className="gallery__ctrl gallery__ctrl--prev" aria-label="Previous image" onClick={() => go(-1)}><Icon name="chevronLeft" size={20} /></button><button type="button" className="gallery__ctrl gallery__ctrl--next" aria-label="Next image" onClick={() => go(1)}><Icon name="chevronRight" size={20} /></button></>}
        {!cur.video && (
          <div className="gallery__tools">
            <button type="button" className="gallery__tool" aria-pressed={zoom} onClick={() => setZoom((z) => !z)}><Icon name="zoom" size={15} />{zoom ? "Reset" : "Zoom"}</button>
            <button type="button" className="gallery__tool gallery__tool--icon" aria-label="Open fullscreen preview" onClick={() => setFull(true)}><Icon name="expand" size={15} /></button>
          </div>
        )}
        {!single && <div className="gallery__dots" aria-hidden="true">{slides.map((_, k) => <span key={k} className="gallery__dot" aria-current={k === i} />)}</div>}
      </div>
      {full && <Viewer slides={slides.filter((s) => !s.video)} start={Math.min(i, images.length - 1)} name={product.product_name} onClose={() => setFull(false)} />}
    </div>
  );
}

function Viewer({ slides, start, name, onClose }) {
  const [i, setI] = useState(start);
  const ref = useRef(null);
  useFocusTrap(ref, true, onClose);
  const go = (d) => setI((x) => (x + d + slides.length) % slides.length);
  useEffect(() => { const k = (e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }; document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k); }, []);
  return createPortal(
    <div className="viewer" ref={ref} role="dialog" aria-modal="true" aria-label={`${name} fullscreen preview`} tabIndex={-1}>
      <div className="viewer__bar"><span>{i + 1} / {slides.length}</span><button type="button" className="icon-btn" aria-label="Close preview" onClick={onClose}><Icon name="close" size={22} /></button></div>
      <div className="viewer__stage">
        <img src={slides[i].src.replace("w=800", "w=1600")} alt={slides[i].alt} />
        {slides.length > 1 && <><button type="button" className="gallery__ctrl gallery__ctrl--prev" aria-label="Previous image" onClick={() => go(-1)}><Icon name="chevronLeft" size={22} /></button><button type="button" className="gallery__ctrl gallery__ctrl--next" aria-label="Next image" onClick={() => go(1)}><Icon name="chevronRight" size={22} /></button></>}
      </div>
      {slides.length > 1 && <div className="viewer__thumbs">{slides.map((s, k) => <button key={k} type="button" className="gallery__thumb" aria-current={k === i} aria-label={`Image ${k + 1}`} onClick={() => setI(k)}><img src={s.src.replace("w=800", "w=200")} alt="" /></button>)}</div>}
    </div>, document.body);
}
