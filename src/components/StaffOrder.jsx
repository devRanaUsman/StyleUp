"use client";
import { useState } from 'react';
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
const stages=['Order placed','Processing','Shipped','Out for delivery','Delivered'];
const transitions=(status,admin)=>status==='Delivered'?(admin?['Returned']:[]):['Cancelled','Returned'].includes(status)?[]:[stages[stages.indexOf(status)+1],...(['Order placed','Processing'].includes(status)?['Cancelled']:[])].filter(Boolean);

export default function StaffOrder({order,admin,save,busy}) {
  const [itemKey,setItemKey]=useState('');
  const [status,setStatus]=useState('');
  const [payment,setPayment]=useState('');
  const [tracking,setTracking]=useState('');
  const [editTracking,setEditTracking]=useState(false);
  const selected=order.items.filter(i=>!itemKey||i.key===itemKey);
  const allowed=transitions(selected[0]?.status,admin).filter(s=>selected.every(i=>i.status===s||transitions(i.status,admin).includes(s)));
  const payments={unpaid:['paid'],paid:['refunded'],refunded:[]}[order.payment?.status]||[];
  return <article className="staff-order">
    <div className="staff-section-head"><div><h3>{order.number}</h3><small>{new Date(order.placedAt).toLocaleString()} · {order.status}</small></div><strong>{money(order.totals.total)}{!admin&&<small> · Your items</small>}</strong></div>
    <p>{order.shipping.firstName} {order.shipping.lastName} · {order.shipping.address1}{order.shipping.address2&&`, ${order.shipping.address2}`}, {order.shipping.city}, {order.shipping.state} {order.shipping.postal}, {order.shipping.country}{order.shipping.phone&&<> · {order.shipping.phone}</>}</p>
    {order.contact&&<p>{order.contact.email} · {order.contact.phone}</p>}
    {order.items.map(i=><p key={i.key}>{i.qty} × {i.name} ({[i.color,i.size].filter(Boolean).join(' / ')||'Standard'}) — <strong>{i.status}</strong>{i.tracking&&` · Tracking: ${i.tracking}`}</p>)}
    {admin&&<p>Cash on delivery · Payment: <strong>{order.payment.status}</strong></p>}
    <form className="staff-inline" onSubmit={e=>{e.preventDefault();save(order.number,{...(itemKey?{itemKeys:[itemKey]}:{}),...(status?{status}:{}),...(payment?{paymentStatus:payment}:{}),...(editTracking?{tracking}:{})});}}>
      <label>Items to update<select value={itemKey} onChange={e=>{setItemKey(e.target.value);setStatus('');setEditTracking(false);setTracking('');}}><option value="">{admin?'All order items':'All your order items'}</option>{order.items.map(i=><option key={i.key} value={i.key}>{i.name} · {[i.color,i.size].filter(Boolean).join(' / ')}</option>)}</select></label>
      <label>Fulfilment<select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Keep current status</option>{allowed.map(s=><option key={s}>{s}</option>)}</select></label>
      {admin&&<label>Payment for entire order<select value={payment} onChange={e=>setPayment(e.target.value)}><option value="">Keep current status</option>{payments.map(s=><option key={s}>{s}</option>)}</select></label>}
      <label>Tracking reference<input placeholder="Leave unchanged" value={tracking} onChange={e=>{setTracking(e.target.value);setEditTracking(true);}}/></label>
      <button disabled={busy||(!status&&!payment&&!editTracking)}>Update order</button>
    </form>
    {!allowed.length&&order.items.length>1&&!itemKey&&<p>Select an individual item to update orders with different fulfilment stages.</p>}
  </article>;
}
