const config = {
  poweredByHeader: false,
  async redirects(){return [
    ...Object.entries({home:'/',bag:'/cart',auth:'/login',profile:'/account',signup:'/register'}).map(([source,destination])=>({source:'/'+source,destination,permanent:true})),
    {source:'/section/:section',destination:'/:section',permanent:true},
  ];},
  async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}];},
};
export default config;
