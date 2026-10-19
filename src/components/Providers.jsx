"use client";
import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { useRouter } from 'next/navigation';
import { makeStore } from '@/store';
import { cartActions } from '@/store/cartSlice';
import { wishlistActions } from '@/store/wishlistSlice';
import { authActions } from '@/store/authSlice';
import { uiActions } from '@/store/uiSlice';
import { storage } from '@/utils/storage';
import { setCatalog } from '@/services/catalogService';
import { configureCommerce } from '@/data/catalog';
import authService from '@/services/authService';
import StoreShell from './StoreShell';
export default function Providers({children,products,user,commerce}){
 const ref=useRef(null);if(!ref.current)ref.current=makeStore(user);const store=ref.current;const router=useRouter();setCatalog(products);configureCommerce(commerce);
 useEffect(()=>{store.dispatch(authActions.setUser(user));store.dispatch(wishlistActions.hydrate({ids:user?.wishlist||storage.get('wishlist',{ids:[]}).ids}));},[user,store]);
 useEffect(()=>{
  store.dispatch(cartActions.hydrate(storage.get('cart',{})));
  store.dispatch(uiActions.hydrate({cookieConsent:storage.get('cookie-consent'),recentSearches:storage.get('recent-searches',[]),recentlyViewed:storage.get('recently-viewed',[])}));
  let lastWish=JSON.stringify(store.getState().wishlist.ids);let timer;
  const unsub=store.subscribe(()=>{clearTimeout(timer);timer=setTimeout(()=>{const s=store.getState();storage.set('cart',{items:s.cart.items,promo:s.cart.promo,shippingMethod:s.cart.shippingMethod});storage.set(s.auth.user?'wishlist:'+s.auth.user.id:'wishlist',{ids:s.wishlist.ids});storage.set('cookie-consent',s.ui.cookieConsent);storage.set('recent-searches',s.ui.recentSearches);storage.set('recently-viewed',s.ui.recentlyViewed);const next=JSON.stringify(s.wishlist.ids);if(s.auth.user&&next!==lastWish)authService.updateWishlist(s.auth.user.id,s.wishlist.ids).catch(()=>{});lastWish=next;},200);});
  const focus=()=>authService.me().then(u=>{if(JSON.stringify(u)!==JSON.stringify(store.getState().auth.user)){store.dispatch(authActions.setUser(u));router.refresh();}}).catch(()=>{});window.addEventListener('focus',focus);
  return()=>{unsub();clearTimeout(timer);window.removeEventListener('focus',focus);};
 },[store,router]);
 return <Provider store={store}><StoreShell>{children}</StoreShell></Provider>;
}
