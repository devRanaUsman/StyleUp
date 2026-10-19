"use client";
import { useState } from 'react';
import { request } from '@/services/api';
export default function OrderActions({order,onChange}){
  const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState(false);
  const canCancel=order.items.every(i=>['Order placed','Processing','Cancelled'].includes(i.status))&&order.status!=='Cancelled';
  const canReturn=order.items.some(i=>i.status==='Delivered');
  async function act(action,body){setBusy(true);setMessage('');setError(false);try{const result=await request('/orders/'+order.number+'/'+action,{method:'POST',body});if(result.order)onChange(result.order);setMessage(action==='return'?'Your return request has been sent to the store.':'Your order was cancelled.');}catch(e){setError(true);setMessage(e.message);}finally{setBusy(false);}}
  if(!canCancel&&!canReturn&&!message)return null;
  return <section className="card order-actions" aria-label="Manage this order">
    {canCancel&&<div className="order-actions__cancel"><div><h2 className="h3">Need to cancel?</h2><p className="muted small">You can cancel this order before it ships.</p></div><button className="btn btn--secondary" disabled={busy} onClick={()=>{if(confirm('Cancel this order?'))act('cancel',{});}}>{busy?'Cancelling…':'Cancel order'}</button></div>}
    {canReturn&&<form className="form-grid" onSubmit={e=>{e.preventDefault();act('return',{reason:new FormData(e.currentTarget).get('reason')});}}><h2 className="h3">Request a return</h2><label className="field">Reason for return<textarea className="textarea" name="reason" minLength={5} maxLength={2000} required/></label><div><button className="btn btn--secondary" disabled={busy}>{busy?'Sending…':'Request a return'}</button></div></form>}
    {message&&<p className={error?'notice notice--error':'notice'} role={error?'alert':'status'}>{message}</p>}
  </section>;
}
