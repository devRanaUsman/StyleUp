import asyncio
from playwright.async_api import async_playwright
BASE="http://localhost:4173"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={"width":1280,"height":900}); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        # register
        await pg.goto(BASE+"/register"); await pg.wait_for_timeout(500)
        await pg.fill("input[name=name]","Ayesha Khan"); await pg.fill("input[name=email]","ayesha@example.com"); await pg.fill("input[name=password]","Passw0rd123")
        cp=await pg.query_selector("input[name=confirm]")
        if cp: await cp.fill("Passw0rd123")
        tc=await pg.query_selector("input[name=terms]")
        if tc: await tc.check()
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(1200); print("after register:",pg.url, [await e.text_content() for e in await pg.query_selector_all(".field__error,.notice")])
        # add product
        await pg.goto(BASE+"/bags"); await pg.wait_for_timeout(700)
        href=await pg.eval_on_selector("a.pcard__media","e=>e.getAttribute('href')"); await pg.goto(BASE+href); await pg.wait_for_timeout(700)
        sz=await pg.query_selector('.sizes [role=radio]:not([aria-disabled="true"])')
        if sz: await sz.click()
        await pg.click("text=Add to cart"); await pg.wait_for_timeout(600)
        print("drawer open:", bool(await pg.query_selector(".drawer.is-open, .drawer[data-open], .drawer")))
        await pg.goto(BASE+"/checkout"); await pg.wait_for_timeout(800); print("checkout:",pg.url)
        await pg.fill("input[name=email]","ayesha@example.com"); await pg.fill("input[name=phone]","+92 300 1234567"); await pg.click("text=Continue to shipping"); await pg.wait_for_timeout(400)
        # submit empty address to test validation retention
        await pg.fill("input[name=firstName]","Ayesha"); await pg.click("text=Continue to delivery"); await pg.wait_for_timeout(300)
        print("inline errors:", len(await pg.query_selector_all(".field__error")), "firstName kept:", await pg.input_value("input[name=firstName]"))
        await pg.fill("input[name=lastName]","Khan"); await pg.fill("input[name=address1]","12 Gulberg Lane"); await pg.fill("input[name=city]","Lahore"); await pg.fill("input[name=state]","Punjab"); await pg.fill("input[name=postal]","54000")
        await pg.click("text=Continue to delivery"); await pg.wait_for_timeout(600)
        print("step2 errs:", [await e.text_content() for e in await pg.query_selector_all(".field__error")], "current:", await pg.eval_on_selector_all(".co-steps li","els=>els.map(e=>e.className+e.textContent)"))
        await pg.click("text=Continue to payment"); await pg.wait_for_timeout(400)
        await pg.fill("input[name=cardName]","Ayesha Khan"); await pg.fill("input[name=cardNumber]","4000000000000002"); await pg.fill("input[name=expiry]","1229"); await pg.fill("input[name=cvc]","123")
        await pg.click("text=Review order"); await pg.wait_for_timeout(400)
        await pg.click("button:has-text('Place order')"); await pg.wait_for_timeout(1500)
        n=await pg.query_selector(".notice--error, [role=alert]"); print("declined msg:", (await n.text_content())[:70] if n else None, "| card kept:", await pg.input_value("input[name=cardNumber]"))
        await pg.fill("input[name=cardNumber]","4242424242424242"); await pg.click("text=Review order"); await pg.wait_for_timeout(300)
        await pg.click("button:has-text('Place order')"); await pg.wait_for_timeout(2000); print("after order:",pg.url)
        print("confirm h1:", await pg.eval_on_selector("h1","e=>e.textContent"))
        await pg.screenshot(path="/tmp/confirm.png")
        await pg.goto(BASE+"/account/orders"); await pg.wait_for_timeout(800); print("orders:", len(await pg.query_selector_all(".order-card")))
        a=await pg.query_selector(".order-card a"); 
        if a: await a.click(); await pg.wait_for_timeout(700); print("order details:", pg.url)
        # screenshots
        for w,name in [(1440,"desktop"),(820,"tablet"),(390,"mobile")]:
            await pg.set_viewport_size({"width":w,"height":900}); await pg.goto(BASE+"/"); await pg.wait_for_timeout(900); await pg.screenshot(path=f"/tmp/home-{name}.png", full_page=False)
            await pg.goto(BASE+href); await pg.wait_for_timeout(900); await pg.screenshot(path=f"/tmp/pdp-{name}.png")
        print("ERRS:",errs)
        await b.close()
asyncio.run(main())
