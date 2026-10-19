"use client";
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { request } from '@/services/api';
export default function Page(){const sp=useSearchParams();const [message,setMessage]=useState('');const [done,setDone]=useState(false);const [busy,setBusy]=useState(false);return <div className="container auth"><h1>Reset your password</h1>{message&&<p role="status">{message}</p>}{done?<Link href="/login">Sign in</Link>:<form className="auth__form" onSubmit={async e=>{e.preventDefault();setBusy(true);try{await request('/auth/reset',{method:'POST',body:{token:sp.get('token'),password:new FormData(e.currentTarget).get('password')}});setDone(true);setMessage('Password changed. Please sign in again.');}catch(e){setMessage(e.message);}finally{setBusy(false);}}}><label>New password<input className="input" type="password" name="password" required minLength={8} maxLength={128} autoComplete="new-password"/></label><p>Use at least 8 characters including a number.</p><button className="btn btn--primary" disabled={busy}>Reset password</button></form>}</div>;}
