export let STORE_NAME = "StyleUp";
// Category tree, navigation, collections and static site content.
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const CATEGORIES = [
  { slug: "women", name: "Women", image: U("1515886657613-9f3515b0c78f", 500), intro: "Dresses, tailoring, knitwear and denim made to move between weekday and weekend.", subcategories: ["Dresses", "Tops", "Shirts", "T-Shirts", "Jeans", "Trousers", "Skirts", "Jackets", "Coats", "Knitwear"] },
  { slug: "men", name: "Men", image: U("1520975954732-35dd22299614", 500), intro: "Considered essentials with clean lines: shirts, trousers, outerwear and knits.", subcategories: ["Shirts", "T-Shirts", "Trousers", "Jeans", "Jackets", "Coats", "Knitwear"] },
  { slug: "bags", name: "Bags", image: U("1584917865442-de89df76afd3", 500), intro: "Crossbody, tote, shoulder and travel bags in leather, canvas and raffia.", subcategories: ["Crossbody Bags", "Tote Bags", "Shoulder Bags", "Satchels", "Bucket Bags", "Backpacks", "Travel", "Clutches", "Belt Bags", "Small Leather Goods"] },
  { slug: "shoes", name: "Shoes", image: U("1543163521-1bf539c55dd2", 500), intro: "Sneakers, loafers, boots and heels built on lasts refined over seasons.", subcategories: ["Sneakers", "Loafers", "Boots", "Heels", "Flats", "Sandals", "Formal"] },
  { slug: "accessories", name: "Accessories", image: U("1515562141207-7a88fb7ce338", 500), intro: "Jewelry, scarves, belts, sunglasses and hats to finish the look.", subcategories: ["Jewelry", "Scarves", "Belts", "Sunglasses", "Hats", "Watches", "Hair"] },
  { slug: "beauty", name: "Beauty", image: U("1596462502278-27bfdc403348", 500), intro: "Skincare, body care, makeup and fragrance made with plant-based formulas.", subcategories: ["Skincare", "Body", "Makeup", "Fragrance", "Hair"] },
  { slug: "home-and-living", name: "Home & Living", image: U("1578500494198-246f612d3b3d", 500), intro: "Ceramics, candles, textiles and tableware for a calm, warm home.", subcategories: ["Decor", "Candles", "Textiles", "Tableware", "Storage", "Fragrance"] },
];
export const categoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);
export const categoryByName = (name) => CATEGORIES.find((c) => c.name === name);

export const COLLECTIONS = [
  { slug: "the-everyday-edit", name: "The Everyday Edit", description: "Effortless pieces for work and weekends.", image: U("1485968579580-b6d095142e6e") },
  { slug: "spring-essentials", name: "Spring Essentials", description: "Fresh styles for the new season.", image: U("1523381210434-271e8be1f52b") },
  { slug: "neutral-minimalism", name: "Neutral Minimalism", description: "Clean, calm and timeless.", image: U("1583744946564-b52ae1a4c1f2") },
  { slug: "weekend-getaway", name: "Weekend Getaway", description: "Travel-ready looks and must-haves.", image: U("1529958030586-3aae56ca4b85") },
  { slug: "office-essentials", name: "Office Essentials", description: "Tailoring that works as hard as you do.", image: U("1594938298603-c8148c4b4bb5") },
  { slug: "evening-edit", name: "Evening Edit", description: "Satin, structure and a little shine.", image: U("1595777457583-95e059d581b8") },
];
export const collectionBySlug = (slug) => COLLECTIONS.find((c) => c.slug === slug);

// Header navigation with mega menu content
export const NAV = [
  { label: "New Arrivals", to: "/new-arrivals" },
  {
    label: "Women", to: "/women",
    mega: {
      columns: [
        { title: "New & Trending", links: [["New Arrivals", "/new-arrivals?category=women"], ["Best Sellers", "/best-sellers?category=women"], ["Trending", "/women?sort=most-reviewed"], ["Seasonal Edit", "/collections/spring-essentials"]] },
        { title: "Clothing", links: ["Dresses", "Tops", "Shirts", "T-Shirts", "Jeans", "Trousers", "Skirts", "Jackets", "Coats", "Knitwear"].map((s) => [s, `/women/${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`]) },
        { title: "Accessories", links: [["Bags", "/bags"], ["Jewelry", "/accessories/jewelry"], ["Scarves", "/accessories/scarves"], ["Belts", "/accessories/belts"], ["Sunglasses", "/accessories/sunglasses"]] },
        { title: "Shop By", links: [["Workwear", "/collections/office-essentials"], ["Casual", "/collections/the-everyday-edit"], ["Occasion", "/collections/evening-edit"], ["Weekend", "/collections/weekend-getaway"], ["Essentials", "/collections/neutral-minimalism"]] },
      ],
      feature: { image: U("1539109136881-3be0616acf4b", 600), title: "The Autumn Layer", text: "Coats, knits and the pieces between.", to: "/women/coats" },
    },
  },
  {
    label: "Men", to: "/men",
    mega: {
      columns: [
        { title: "New & Trending", links: [["New Arrivals", "/new-arrivals?category=men"], ["Best Sellers", "/best-sellers?category=men"], ["Trending", "/men?sort=most-reviewed"], ["Seasonal Edit", "/collections/spring-essentials"]] },
        { title: "Clothing", links: ["Shirts", "T-Shirts", "Trousers", "Jeans", "Jackets", "Coats", "Knitwear"].map((s) => [s, `/men/${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`]) },
        { title: "Accessories", links: [["Bags", "/bags/backpacks"], ["Belts", "/accessories/belts"], ["Watches", "/accessories/watches"], ["Sunglasses", "/accessories/sunglasses"], ["Hats", "/accessories/hats"]] },
        { title: "Shop By", links: [["Workwear", "/collections/office-essentials"], ["Casual", "/collections/the-everyday-edit"], ["Weekend", "/collections/weekend-getaway"], ["Essentials", "/collections/neutral-minimalism"]] },
      ],
      feature: { image: U("1507679799987-c73779587ccf", 600), title: "Tailoring, Relaxed", text: "Unstructured blazers and pleated trousers.", to: "/men/jackets" },
    },
  },
  {
    label: "Bags", to: "/bags",
    mega: {
      columns: [
        { title: "Styles", links: ["Crossbody Bags", "Tote Bags", "Shoulder Bags", "Satchels", "Bucket Bags", "Clutches"].map((s) => [s, `/bags/${s.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`]) },
        { title: "Travel & Everyday", links: [["Backpacks", "/bags/backpacks"], ["Travel", "/bags/travel"], ["Belt Bags", "/bags/belt-bags"], ["Small Leather Goods", "/bags/small-leather-goods"]] },
        { title: "Shop By", links: [["New Arrivals", "/new-arrivals?category=bags"], ["Best Sellers", "/best-sellers?category=bags"], ["On Sale", "/sale?category=bags"], ["Evening", "/collections/evening-edit"]] },
      ],
      feature: { image: U("1548036328-c9fa89d128fa", 600), title: "Carry Well", text: "Leather that ages beautifully.", to: "/bags/tote-bags" },
    },
  },
  {
    label: "Shoes", to: "/shoes",
    mega: {
      columns: [
        { title: "Styles", links: ["Sneakers", "Loafers", "Boots", "Heels", "Flats", "Sandals", "Formal"].map((s) => [s, `/shoes/${s.toLowerCase()}`]) },
        { title: "Shop By", links: [["New Arrivals", "/new-arrivals?category=shoes"], ["Best Sellers", "/best-sellers?category=shoes"], ["On Sale", "/sale?category=shoes"], ["Size Guide", "/size-guide"]] },
      ],
      feature: { image: U("1549298916-b41d501d3772", 600), title: "Clean Sneakers", text: "Everyday pairs in leather and canvas.", to: "/shoes/sneakers" },
    },
  },
  { label: "Beauty", to: "/beauty", mega: { columns: [{ title: "Categories", links: ["Skincare", "Body", "Makeup", "Fragrance", "Hair"].map((s) => [s, `/beauty/${s.toLowerCase()}`]) }, { title: "Shop By", links: [["New Arrivals", "/new-arrivals?category=beauty"], ["Best Sellers", "/best-sellers?category=beauty"], ["Gift Ideas", "/beauty/fragrance"]] }], feature: { image: U("1556228578-8c89e6adf883", 600), title: "Slow Mornings", text: "Botanical skincare for daily rituals.", to: "/beauty/skincare" } } },
  { label: "Home & Living", to: "/home-and-living", mega: { columns: [{ title: "Categories", links: ["Decor", "Candles", "Textiles", "Tableware", "Storage"].map((s) => [s, `/home-and-living/${s.toLowerCase()}`]) }, { title: "Shop By", links: [["New Arrivals", "/new-arrivals?category=home-and-living"], ["Best Sellers", "/best-sellers?category=home-and-living"], ["Neutral Minimalism", "/collections/neutral-minimalism"]] }], feature: { image: U("1586023492125-27b2c045efd7", 600), title: "Warm Neutrals", text: "Stoneware, linen and soft light.", to: "/home-and-living/decor" } } },
  { label: "Best Sellers", to: "/best-sellers" },
  { label: "Top Deals", to: "/sale", accent: true },
];

export const TRUST = [
  { icon: "truck", title: "Free Shipping", text: "On orders over $50" },
  { icon: "refresh", title: "Easy Returns", text: "30-day returns" },
  { icon: "lock", title: "Secure Payments", text: "100% secure checkout" },
  { icon: "headset", title: "24/7 Support", text: "We're here to help" },
];

export const FOOTER_BENEFITS = [
  { icon: "award", title: "Curated Quality", text: "Premium materials and lasting design." },
  { icon: "leaf", title: "Sustainable Choices", text: "Thoughtful sourcing for a better planet." },
  { icon: "heart", title: "Loved by Thousands", text: "Join our happy customer community." },
  { icon: "shield", title: "Easy & Secure", text: "Shopping made simple, payments protected." },
];

export const FOOTER_LINKS = {
  Shop: [["New Arrivals", "/new-arrivals"], ["Women", "/women"], ["Men", "/men"], ["Bags", "/bags"], ["Shoes", "/shoes"], ["Beauty", "/beauty"], ["Home & Living", "/home-and-living"], ["Top Deals", "/sale"]],
  "Customer Service": [["Contact Us", "/contact"], ["Shipping & Delivery", "/shipping"], ["Returns & Exchanges", "/returns"], ["Order Tracking", "/track-order"], ["Size Guide", "/size-guide"], ["FAQs", "/faq"]],
  "About StyleUp": [["About Us", "/about"], ["Our Story", "/about#our-story"], ["Sustainability", "/sustainability"], ["Gift Cards", "/gift-cards"], ["Store Locator", "/contact#stores"], ["Careers", "/about#the-team"]],
};

export let FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_METHODS = [
  { id: "standard", name: "Standard Delivery", eta: "3–6 business days", price: 5.95, freeOver: FREE_SHIPPING_THRESHOLD },
  { id: "express", name: "Express Delivery", eta: "1–2 business days", price: 14.95 },
  { id: "pickup", name: "Collect from Store", eta: "Ready in 2 hours", price: 0 },
];
export let TAX_RATE = 0.08;

export const PROMO_CODES = {
  WELCOME10: { type: "percent", value: 10, label: "10% off your first order" },
  STYLE20: { type: "percent", value: 20, label: "20% off", minSubtotal: 100 },
  FREESHIP: { type: "shipping", value: 0, label: "Free standard shipping" },
  SPRING15: { type: "percent", value: 15, label: "Spring Refresh 15% off", expires: "2026-04-30" },
};

// Sale campaign — countdown only renders while active
export const SALE_CAMPAIGN = {
  name: "Spring Refresh Sale",
  headline: "Up to 40% off",
  sub: "on selected styles",
  ends: "2026-12-31T23:59:59",
};

export const TRENDING_SEARCHES = ["linen dress", "crossbody bag", "white sneakers", "gold hoops", "wool coat", "scented candle"];
export const COUNTRIES = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Netherlands", "Spain", "Italy", "Pakistan", "United Arab Emirates", "India", "Japan", "Singapore"];

export function configureCommerce({settings,coupons}){STORE_NAME=settings.storeName;TAX_RATE=settings.taxRate;FREE_SHIPPING_THRESHOLD=settings.freeShipping;SHIPPING_METHODS[0].price=settings.standardShipping;SHIPPING_METHODS[0].freeOver=settings.freeShipping;SHIPPING_METHODS[1].price=settings.expressShipping;for(const k of Object.keys(PROMO_CODES))delete PROMO_CODES[k];Object.assign(PROMO_CODES,coupons);}
