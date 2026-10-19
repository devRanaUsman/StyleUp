import { useState } from "react";
import { Breadcrumb, Button } from "../../components/ui";
import { useSeo, breadcrumbLd } from "../../hooks/useSeo";

const TABLES = {
  "Women's clothing": { cols: ["Size", "Bust", "Waist", "Hips", "US", "UK", "EU"], rows: [["XS", "80–84", "62–66", "86–90", "0–2", "4–6", "32–34"], ["S", "84–88", "66–70", "90–94", "4–6", "8–10", "36–38"], ["M", "88–92", "70–74", "94–98", "8–10", "12–14", "40–42"], ["L", "92–98", "74–80", "98–104", "12–14", "16–18", "44–46"], ["XL", "98–104", "80–88", "104–110", "16–18", "20–22", "48–50"], ["XXL", "104–112", "88–96", "110–118", "20–22", "24–26", "52–54"]] },
  "Men's clothing": { cols: ["Size", "Chest", "Waist", "Neck", "Sleeve"], rows: [["XS", "84–88", "72–76", "36–37", "81"], ["S", "88–94", "76–82", "37–38", "83"], ["M", "94–100", "82–88", "39–40", "85"], ["L", "100–106", "88–94", "41–42", "87"], ["XL", "106–112", "94–100", "43–44", "89"], ["XXL", "112–120", "100–108", "45–46", "91"]] },
  Shoes: { cols: ["EU", "Foot length (cm)", "US Women", "US Men", "UK"], rows: [["36", "23.0", "5", "—", "3.5"], ["37", "23.7", "6", "—", "4"], ["38", "24.3", "7", "—", "5"], ["39", "25.0", "8", "6", "6"], ["40", "25.7", "9", "7", "6.5"], ["41", "26.3", "10", "8", "7.5"], ["42", "27.0", "—", "9", "8"], ["43", "27.7", "—", "10", "9"], ["44", "28.3", "—", "11", "10"], ["45", "29.0", "—", "12", "11"]] },
};

export default function SizeGuide() {
  const crumbs = [{ label: "Home", to: "/" }, { label: "Size guide", to: "/size-guide" }];
  useSeo({ title: "Size guide", description: "StyleUp size charts for women's and men's clothing and shoes, with measuring tips.", path: "/size-guide", jsonLd: breadcrumbLd(crumbs) });
  const [tab, setTab] = useState(Object.keys(TABLES)[0]);
  const t = TABLES[tab];
  return (
    <div className="container">
      <div style={{ paddingTop: 16 }}><Breadcrumb items={crumbs} /></div>
      <div className="info-hero"><h1 className="h1">Size guide</h1><p className="lead">Measurements in centimetres. If you're between sizes, size up for a relaxed fit or down for a closer one.</p></div>
      <div style={{ maxWidth: 900, paddingBottom: 64 }}>
        <div className="tabs tabs--pills" role="tablist" style={{ marginBottom: 20 }}>{Object.keys(TABLES).map((k) => <button key={k} type="button" role="tab" className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{k}</button>)}</div>
        <div className="size-table"><table><thead><tr>{t.cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{t.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody></table></div>
        <h2 className="h3" style={{ marginBottom: 14 }}>How to measure</h2>
        <div className="tips">
          <div className="tip"><b>Bust / chest</b>Measure around the fullest part, keeping the tape level and relaxed.</div>
          <div className="tip"><b>Waist</b>Measure around your natural waistline — the narrowest point, usually just above the navel.</div>
          <div className="tip"><b>Hips</b>Stand with feet together and measure around the fullest part of your hips.</div>
          <div className="tip"><b>Feet</b>Stand on paper, mark heel and longest toe, and measure the distance. Measure both feet and use the larger.</div>
          <div className="tip"><b>Bags</b>Dimensions on each product page are width × height × depth. A laptop sleeve fits up to 14" unless stated.</div>
          <div className="tip"><b>Still unsure?</b>Every order has free returns and exchanges, so ordering two sizes to try is completely fine.</div>
        </div>
        <div className="row" style={{ marginTop: 32 }}><Button to="/women">Shop women</Button><Button variant="secondary" to="/men">Shop men</Button><Button variant="tertiary" to="/contact" iconRight="arrowRight">Ask us for sizing help</Button></div>
      </div>
    </div>
  );
}
