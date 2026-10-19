"use client";
import NextLink from 'next/link';
import { usePathname, useRouter, useParams as nextParams, useSearchParams as nextSearch } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';
export function safePath(value, fallback='/account') { return typeof value==='string' && /^\/(?!\/)/.test(value) && !/[\\\u0000-\u0020]/.test(value) ? value : fallback; }
export function Link({to, ...props}) { return <NextLink href={to || '/'} {...props}/>; }
export function NavLink({to, end, className, children, ...props}) { const pathname=usePathname(); const isActive=end ? pathname===to : pathname===to || pathname.startsWith(to+'/'); return <Link to={to} {...props} aria-current={isActive?'page':undefined} className={typeof className==='function'?className({isActive}):className}>{typeof children==='function'?children({isActive}):children}</Link>; }
export function useNavigate(){ const r=useRouter(); return useCallback((to,options={})=>{ if(typeof to==='number') {r.back();return;} r[options.replace?'replace':'push'](safePath(to,'/')); },[r]); }
export function useLocation(){const pathname=usePathname();const sp=nextSearch();return useMemo(()=>({pathname,search:sp.size?'?'+sp.toString():'',hash:'',state:null}),[pathname,sp]);}
export const useParams=nextParams;
export function useSearchParams(){const sp=nextSearch();const r=useRouter();const p=usePathname(); const set=useCallback((value,options={})=>{const next=typeof value==='function'?value(new URLSearchParams(sp)):value;const q=new URLSearchParams(next).toString();r[options.replace?'replace':'push'](p+(q?'?'+q:''),{scroll:false});},[sp,r,p]);return [sp,set];}
export function Navigate({to}) {const navigate=useNavigate();useEffect(()=>navigate(to,{replace:true}),[to,navigate]);return null;}
