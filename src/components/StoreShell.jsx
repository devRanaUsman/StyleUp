"use client";
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Header from './layout/Header';
import Footer from './layout/Footer';
import BottomNav from './layout/BottomNav';
import CookieBanner from './layout/CookieBanner';
import CartDrawer from './cart/CartDrawer';
import SearchOverlay from './search/SearchOverlay';
import QuickView from './product/QuickView';
import { ToastHost } from './ui/Overlays';
import { BackToTop } from './ui';
import { uiActions } from '@/store/uiSlice';
export default function StoreShell({children}){const path=usePathname();const dispatch=useDispatch();useEffect(()=>{dispatch(uiActions.closeAll());},[path,dispatch]);const minimal=path.startsWith('/checkout')||path.startsWith('/admin')||path.startsWith('/seller');return <><a href="#main" className="skip-link">Skip to content</a>{!minimal&&<Header/>}<main id="main" className={minimal?'':'has-bottom-nav'}>{children}</main>{!minimal&&<><Footer/><BottomNav/></>}<CartDrawer/><SearchOverlay/><QuickView/><ToastHost/><CookieBanner/><BackToTop/></>;}
