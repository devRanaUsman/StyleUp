import { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from '@/components/navigation';
import Icon from '../../components/ui/Icon';
import { Button, Input, Notice, ProductImage } from '../../components/ui';
import { cartActions, selectCartItems, selectCartTotals } from '@/store/cartSlice';
import orderService from '../../services/orderService';
import { SHIPPING_METHODS, COUNTRIES } from '../../data/catalog';
import { money } from '../../utils/format';
import { storage } from '../../utils/storage';
import { OrderSummary, PromoForm } from '../Cart';
import { Logo } from '../../components/layout/Header';

const FIELDS = [['firstName', 'First name'], ['lastName', 'Last name'], ['address1', 'Street address'], ['address2', 'Apartment (optional)'], ['city', 'City'], ['state', 'State / region'], ['postal', 'Postal code'], ['phone', 'Phone']];

export default function Checkout() {
  const items=useSelector(selectCartItems);
  const totals=useSelector(selectCartTotals);
  const user=useSelector(s=>s.auth.user);
  const dispatch=useDispatch();
  const navigate=useNavigate();
  const key=useRef(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [review,setReview]=useState(null);
  const [draft,setDraft]=useState(()=>user?.addresses?.find(a=>a.isDefault)||{});
  useEffect(()=>{
    try { key.current=sessionStorage.getItem('stylehub:checkout-key'); } catch {}
    key.current ||= crypto.randomUUID();
    try { sessionStorage.setItem('stylehub:checkout-key',key.current); } catch {}
  },[]);
  const signature=JSON.stringify({items:items.map(({productId,color,size,qty})=>({productId,color,size,qty})),method:totals.method.id,promo:totals.promoCode});
  const currentReview=review?.signature===signature?review:null;
  const shown=currentReview?.quote;
  async function reviewOrder(e) {
    e.preventDefault();
    if(busy)return;
    const shipping=Object.fromEntries(new FormData(e.currentTarget));
    setDraft(shipping);setBusy(true);setError('');
    const payload={idempotencyKey:key.current,items:items.map(({productId,color,size,qty})=>({productId,color,size,qty})),contact:{email:user.email,phone:shipping.phone},shipping,method:{id:totals.method.id},payment:{type:'cod'},totals:{promoCode:totals.promoCode}};
    try { const quote=await orderService.quote(payload);setReview({quote,payload,signature}); }
    catch(e) {setError(e.message);}
    finally {setBusy(false);}
  }
  async function place() {
    if(busy||!currentReview)return;
    setBusy(true);setError('');
    try {
      const saved=await orderService.place({...currentReview.payload,expectedTotal:shown.totals.total});
      try {sessionStorage.removeItem('stylehub:checkout-key');} catch {}
      storage.set('cart',{items:[],promo:null,shippingMethod:totals.method.id});
      dispatch(cartActions.clear());navigate('/order-confirmation/'+saved.number,{replace:true});
    } catch(e) {
      setError(e.message);if([400,409].includes(e.status))setReview(null);setBusy(false);
    }
  }
  return (
    <div className="checkout-page">
      <header className="co-header">
        <div className="container">
          <Logo />
          <span className="co-header__secure"><Icon name="lock" size={14} />Secure checkout</span>
          <Link to="/cart" className="link">Back to bag</Link>
        </div>
      </header>
      <div className="container co-wrap">
        <div className="page-head co-head">
          <h1 className="h1">Checkout</h1>
          <p className="lead">Signed in as {user?.email}. Payment is due on delivery or collection.</p>
        </div>
        {error && <div className="co-global-error"><Notice tone="error" icon="alert" role="alert">{error}</Notice></div>}
        {!items.length && !busy ? (
          <div className="card co-empty">
            <p>Your bag is empty.</p>
            <Button to="/shop">Continue shopping</Button>
          </div>
        ) : (
          <div className="co-layout">
            <div className="co-main">
              {!currentReview ? (
                <form className="card co-section" onSubmit={reviewOrder} noValidate>
                  <div className="co-section__head">
                    <h2 className="h3"><span className="co-section__num">1</span>Shipping address</h2>
                  </div>
                  {user?.addresses?.length>0 && (
                    <div className="field">
                      <label className="field__label" htmlFor="saved-address">Saved address</label>
                      <div className="select-wrap">
                        <select id="saved-address" className="select" defaultValue="" onChange={e=>{const a=user.addresses.find(a=>a.id===e.target.value);if(a){setDraft(a);const form=e.currentTarget.form;for(const [k,v] of Object.entries(a)){const el=form.elements.namedItem(k);if(el&&typeof v==='string')el.value=v;}}}}>
                          <option value="">Enter a new address</option>
                          {user.addresses.map(a=><option key={a.id} value={a.id}>{a.address1}, {a.city}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="form-grid form-grid--2">
                    {FIELDS.map(([name,label])=><Input key={name} label={label} name={name} required={name!=='address2'} maxLength={name==='postal'?30:name==='phone'?40:['firstName','lastName'].includes(name)?80:name.startsWith('address')?200:100} defaultValue={draft[name]||''} autoComplete={name==='firstName'?'given-name':name==='lastName'?'family-name':name==='address1'?'address-line1':name==='address2'?'address-line2':name==='city'?'address-level2':name==='state'?'address-level1':name==='postal'?'postal-code':name==='phone'?'tel':undefined} />)}
                    <div className="field">
                      <label className="field__label" htmlFor="country">Country</label>
                      <div className="select-wrap"><select id="country" name="country" className="select" defaultValue={draft.country||'United States'} required>{COUNTRIES.map(c=><option key={typeof c==='string'?c:c.value} value={typeof c==='string'?c:c.value}>{typeof c==='string'?c:c.label}</option>)}</select></div>
                    </div>
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="delivery">Delivery</label>
                    <div className="select-wrap"><select id="delivery" className="select" value={totals.method.id} onChange={e=>dispatch(cartActions.setShipping(e.target.value))}>{SHIPPING_METHODS.map(m=><option key={m.id} value={m.id}>{m.name} · {m.eta}</option>)}</select></div>
                  </div>
                  <div className="notice"><Icon name="lock" size={16} /><div>Cash on delivery. No card details are required.</div></div>
                  <div className="co-actions"><Button type="submit" size="lg" loading={busy}>Review order</Button></div>
                </form>
              ) : (
                <section className="card co-section">
                  <div className="co-section__head">
                    <h2 className="h3"><span className="co-section__num">2</span>Review your order</h2>
                    <button type="button" className="co-section__edit" onClick={()=>setReview(null)}>Edit</button>
                  </div>
                  <dl className="review-block">
                    <div className="review-row"><dt>Ship to</dt><dd>{shown.shipping.firstName} {shown.shipping.lastName}<br/>{shown.shipping.address1}{shown.shipping.address2&&`, ${shown.shipping.address2}`}<br/>{shown.shipping.city}, {shown.shipping.state} {shown.shipping.postal}<br/>{shown.shipping.country}</dd><dd><button type="button" className="co-section__edit" onClick={()=>setReview(null)}>Edit</button></dd></div>
                    <div className="review-row"><dt>Delivery</dt><dd>{shown.method.name} · {shown.method.eta}</dd><dd /></div>
                    <div className="review-row"><dt>Payment</dt><dd>Cash on delivery</dd><dd /></div>
                  </dl>
                  <div className="notice"><Icon name="info" size={16} /><div>These prices were checked with the store. Any total change requires a new review.</div></div>
                  <div className="co-actions">
                    <Button variant="secondary" onClick={()=>setReview(null)} disabled={busy}>Edit order</Button>
                    <Button size="lg" onClick={place} loading={busy}>Place order · {money(shown.totals.total)}</Button>
                  </div>
                  <p className="small muted">By placing your order you accept our <Link to="/terms" className="link">Terms</Link> and <Link to="/privacy" className="link">Privacy Policy</Link>.</p>
                </section>
              )}
            </div>
            <aside className="card co-side" aria-label="Order summary">
              <h2 className="h3 co-side__title">Order summary</h2>
              <div className="co-items">
                {(shown?.items||items).map(i=><div key={i.key} className="co-item"><div className="co-item__img"><ProductImage src={i.image} alt="" sizes="56px" name={i.name} /><span className="co-item__qty">{i.qty}</span></div><div><div className="co-item__name">{i.name}</div><div className="co-item__variant">{[i.color,i.size].filter(Boolean).join(" · ")}</div></div><span className="co-item__price">{money(i.qty*i.price)}</span></div>)}
              </div>
              {!currentReview && <PromoForm />}
              <OrderSummary totals={shown?.totals||totals} />
              {!currentReview && <p className="small muted co-side__note">The final price is checked when you review your order.</p>}
              <Link to="/cart" className="link small">Edit bag</Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
