import { request } from './api';
const authService={
 me:async()=>{try{return (await request('/auth/me')).user;}catch(e){if(e.status===401)return null;throw e;}},
 login:async(email,password,role,remember=true)=>(await request('/auth/login',{method:'POST',body:{email,password,role,remember}})).user,
 register:async({name,email,password,role='customer'})=>(await request('/auth/signup',{method:'POST',body:{name,email,password,role}})).user,
 logout:()=>request('/auth/logout',{method:'POST',body:{}}),
 forgotPassword:email=>request('/auth/forgot',{method:'POST',body:{email}}),
 updateProfile:async(id,patch)=>(await request('/users/'+id,{method:'PATCH',body:patch})).user,
 changePassword:(id,current,next)=>request('/users/'+id,{method:'PATCH',body:{currentPassword:current,newPassword:next}}),
 saveAddresses:async(id,addresses)=>(await request('/users/'+id+'/addresses',{method:'PUT',body:{addresses}})).user,
 savePaymentMethods:async()=>{throw new Error('Saved cards are unavailable until a payment provider is connected.');},
 getWishlist:async(id)=>(await request('/users/'+id+'/wishlist')).ids,
 updateWishlist:async(id,ids)=>(await request('/users/'+id+'/wishlist',{method:'PUT',body:{ids}})).ids,
};export default authService;