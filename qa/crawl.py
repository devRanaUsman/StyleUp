import sys, json, re
from playwright.sync_api import sync_playwright
BASE="http://localhost:4173"
routes=["/","/shop","/women","/men","/bags","/shoes","/accessories","/beauty","/home-and-living","/new-arrivals","/best-sellers","/sale","/categories","/collections","/collections/the-everyday-edit","/search?q=bag","/search?q=blazr","/search?q=zzzzqq","/wishlist","/cart","/checkout","/login","/register","/forgot-password","/track-order","/about","/contact","/faq","/shipping","/returns","/privacy","/terms","/size-guide","/sustainability","/gift-cards","/does-not-exist","/women/dresses","/bags/totes","/account","/order-confirmation/SH-0000"]
errors={}
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1440,"height":900}); pg=ctx.new_page()
    pg.route(re.compile(r"images\.unsplash\.com|fonts\.g"), lambda r: r.abort())
    def onerr(e): errors.setdefault(pg.url,[]).append(str(e)[:300])
    pg.on("pageerror", onerr)
    pg.on("console", lambda m: onerr("console.error: "+m.text) if m.type=="error" and "unsplash" not in m.text and "net::ERR" not in m.text and "Failed to load resource" not in m.text else None)
    # get a product url
    pg.goto(BASE+"/women", wait_until="networkidle"); pg.wait_for_timeout(600)
    prod=pg.evaluate("[...document.querySelectorAll('a.pcard__name')].slice(0,3).map(a=>a.getAttribute('href'))")
    routes += prod
    links=set()
    for r in routes:
        pg.goto(BASE+r, wait_until="networkidle"); pg.wait_for_timeout(500)
        t=pg.title(); h1=pg.evaluate("document.querySelector('h1')?.textContent||''")
        for a in pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))"):
            if a and a.startswith('/'): links.add(a.split('#')[0])
        print(f"{r:45s} | {t[:50]:50s} | h1={h1[:40]}")
    print("\n== ERRORS =="); print(json.dumps(errors,indent=1) if errors else "none")
    # check all internal links resolve (not 404 page)
    print("\n== LINK AUDIT ==", len(links))
    bad=[]
    for l in sorted(links):
        if l in routes: continue
        pg.goto(BASE+l, wait_until="domcontentloaded"); pg.wait_for_timeout(700)
        if pg.evaluate("!!document.querySelector('.nf')"): bad.append(l)
    print("dead links:", bad if bad else "none")
    b.close()
