"use client";
import { useState } from 'react';
import Link from 'next/link';
import authService from '@/services/authService';
import { accountHome } from '@/utils/account';

export default function StaffAuth({role,register=false}) {
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [showPassword,setShowPassword]=useState(false);
  async function submit(e) {
    e.preventDefault();if(busy)return;
    setBusy(true);setError('');
    const data=Object.fromEntries(new FormData(e.currentTarget));
    try {
      const user=register?await authService.register({...data,role:'seller'}):await authService.login(data.email,data.password);
      window.location.assign(accountHome(user.role));
    } catch(e) {setError(e.message);setBusy(false);}
  }
  return <div className="staff-auth">
    <Link href="/" className="staff-brand">STYLEUP</Link>
    <div className="staff-auth__card">
      <p className="staff-eyebrow">{role==='admin'?'STORE ADMINISTRATION':'SELLER STUDIO'}</p>
      <h1>{register?'Start selling with us':role==='admin'?'Admin sign in':'Seller sign in'}</h1>
      <p>{register?'Create your seller account. An administrator will review it before you can publish products.':'Enter your account details. We’ll open the dashboard that matches your account.'}</p>
      {!register&&<nav className="auth-portals" aria-label="Sign-in options"><Link href="/login">Customer</Link><Link href="/seller/login" aria-current={role==='seller'?'page':undefined}>Seller</Link><Link href="/admin/login" aria-current={role==='admin'?'page':undefined}>Admin</Link></nav>}
      {error&&<p role="alert" className="staff-error">{error}</p>}
      <form onSubmit={submit}>
        {register&&<label>Full name<input name="name" required maxLength={200} autoComplete="name"/></label>}
        <label>Email address<input name="email" type="email" required autoComplete="username" autoCapitalize="none" spellCheck={false}/></label>
        <div><label htmlFor="staff-password">Password</label><div className="staff-password"><input id="staff-password" name="password" type={showPassword?'text':'password'} required minLength={register?8:1} maxLength={128} autoComplete={register?'new-password':'current-password'}/><button type="button" aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button></div></div>
        {register&&<small>Use at least 8 characters including a number.</small>}
        <button type="submit" disabled={busy}>{busy?'Signing in…':register?'Create seller account':'Sign in'}</button>
      </form>
      {role==='seller'&&<p><Link href={register?'/seller/login':'/seller/register'}>{register?'Already registered? Sign in':'Apply for a seller account'}</Link></p>}
      <Link href="/">← Back to store</Link>
    </div>
  </div>;
}
