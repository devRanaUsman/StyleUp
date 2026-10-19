// Generates src/data/products.json — 200+ distinct, realistic StyleUp products.
// Deterministic (seeded) so the catalog is stable between runs.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------- seeded random ----------
let seed = 20260903;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + rand() * (max - min);
const int = (min, max) => Math.floor(between(min, max + 1));
const chance = (p) => rand() < p;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const slugify = (s) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ---------- image pools (Unsplash photo IDs by subject) ----------
const IMG = {
  womenDress: ["1515886657613-9f3515b0c78f", "1496747611176-843222e1e57c", "1583496661160-fb5886a0aaaa", "1595777457583-95e059d581b8", "1576871337622-98d48d1cf531", "1490725263030-1f0521cec8ec", "1509631179647-0177331693ae"],
  womenTop: ["1554568218-0f1715e72254", "1583744946564-b52ae1a4c1f2", "1515347619252-60a4bf4fff4f", "1551232864-3f0890e580d9", "1485968579580-b6d095142e6e", "1487222477894-8943e31ef7b2"],
  womenBottom: ["1591369822096-ffd140ec948f", "1594633312681-425c7b97ccd1", "1541099649105-f69ad21f3246", "1542272604-787c3835535d", "1521223890158-f9f7c3d5d504", "1539533018447-63fcce2678e3"],
  womenOuter: ["1539109136881-3be0616acf4b", "1548624313-0396c75e4b1a", "1544022613-e87ca75a784a", "1559551409-dadc959f76b8", "1601924994987-69e26d50dc26", "1483985988355-763728e1935b"],
  menTop: ["1602810318383-e386cc2a3ccf", "1521572163474-6864f9cf17ab", "1581655353564-df123a1eb820", "1617137968427-85924c800a22", "1596755094514-f87e34085b2c", "1620012253295-c15cc3e65df4", "1523381210434-271e8be1f52b"],
  menBottom: ["1473966968600-fa801b869a1a", "1550246140-5119ae4790b8", "1488161628813-04466f872be2", "1506634572416-48cdfe530110", "1516826957135-700dedea698c"],
  menOuter: ["1594938298603-c8148c4b4bb5", "1507679799987-c73779587ccf", "1611312449408-fcece27cdbb7", "1591047139829-d91aecb6caea", "1556821840-3a63f95609a7", "1520975954732-35dd22299614", "1525507119028-ed4c629a60a3"],
  bags: ["1584917865442-de89df76afd3", "1548036328-c9fa89d128fa", "1590874103328-eac38a683ce7", "1591561954557-26941169b49e", "1559563458-527698bf5295", "1566150905458-1bf1fc113f0d", "1575032617751-6ddec2089882", "1597633425046-08f5110420b5", "1594223274512-ad4803739b7c", "1614179689702-355944cd0918", "1601369117788-c5d2c6aa5ea1", "1596149615493-f0739de31c2d"],
  backpacks: ["1553062407-98eeb64c6a62", "1547949003-9792a18a2601", "1622560480605-d83c853bc5c3"],
  sneakers: ["1542291026-7eec264c27ff", "1549298916-b41d501d3772", "1595950653106-6c9ebd614d3a", "1560343090-f0409e92791a", "1600185365483-26d7a4cc7519", "1605348532760-6753d2c43329", "1525966222134-fcfa99b8ae77", "1491553895911-0055eca6402d"],
  heels: ["1543163521-1bf539c55dd2", "1535043934128-cf0b28d52f95", "1520639888713-7851133b1ed0", "1580906853203-f4a5ae3b6c1a"],
  boots: ["1596703263926-eb0762ee17e4", "1562273138-f46be4ebdf33", "1516478177764-9fe5bd7e9717", "1608256246200-53e635b5b65f", "1603487742131-4160ec999306", "1556906781-9a412961c28c"],
  jewelry: ["1515562141207-7a88fb7ce338", "1599643478518-a784e5dc4c8f", "1611591437281-460bfbe1220a", "1573408301185-9146fe634ad0", "1602173574767-37ac01994b2a", "1535632066927-ab7c9ab60908", "1617038220319-276d3cfab638"],
  sunglasses: ["1506630448388-4e683c67ddb0", "1511499767150-a48a237f0083", "1572635196237-14b3f281503f"],
  watches: ["1524592094714-0f0654e20314", "1523170335258-f5ed11844a49", "1508685096489-7aacd43bd3b1", "1434389677669-e08b4cac3105"],
  hats: ["1520903920243-00d872a2d1c9", "1529958030586-3aae56ca4b85", "1521369909029-2afed882baee"],
  scarves: ["1601924921557-45e6dea0a157", "1584030373081-f37b7bb4fa8e", "1601924582970-9238bcb495d9"],
  skincare: ["1596462502278-27bfdc403348", "1556228578-8c89e6adf883", "1571781926291-c477ebfd024b", "1608248543803-ba4f8c70ae0b", "1598440947619-2c35fc9aa908", "1620916566398-39f1143ab7be", "1570172619644-dfd03ed5d881"],
  makeup: ["1522335789203-aabd1fc54bc9", "1586495777744-4413f21062fa", "1512496015851-a90fb38ba796", "1608571423902-eed4a5ad8108"],
  fragrance: ["1601049676869-702ea24cfd58", "1541643600914-78b084683601", "1594035910387-fea47794261f"],
  decor: ["1578500494198-246f612d3b3d", "1584589167171-541ce45f1eab", "1586023492125-27b2c045efd7", "1513519245088-0e12902e5a38", "1616486338812-3dadae4b4ace", "1616046229478-9901c5536a45", "1567016432779-094069958ea5", "1522708323590-d24dbb6b0267"],
  candles: ["1602028915047-37269d1a73f7", "1602874801006-e26c4c5b5b6a", "1601612628452-9e99ced43524"],
  textiles: ["1540932239986-30128078f3c5", "1615529328331-f8917597711f", "1524758631624-e2822e304c36", "1519710164239-da123dc03ef4"],
  tableware: ["1558211583-d26f610c1eb1", "1584100936595-c0654b55a2e6", "1493663284031-b7e3aefcae8e"],
};
const img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

// ---------- vocabulary ----------
const CLOTH_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SHOE_W = ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41"];
const SHOE_M = ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"];
const SHOE_U = ["EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"];

const COLORS = {
  Ivory: "#F2EDE4", Cream: "#F5EFE3", Sand: "#D9C7AC", Beige: "#C9B79C", Camel: "#B58A5A", Tan: "#C29A6B", Cognac: "#8B4A2B",
  Chocolate: "#4A2E22", Black: "#1B1B1B", Charcoal: "#3B3B3B", Stone: "#B9B2A6", Grey: "#8F8B84", White: "#FFFFFF",
  Navy: "#1F2A44", Indigo: "#2B3A67", "Light Wash": "#9FB4C7", "Mid Wash": "#5A7A9B", Olive: "#6B6E3F", Sage: "#9AA98B",
  "Forest Green": "#0B5A3C", Blush: "#EEC8BE", "Dusty Rose": "#C99A96", Terracotta: "#B65D45", Burgundy: "#6B2231",
  Mustard: "#C9A227", Lilac: "#B9A6C9", "Sky Blue": "#A7C7E7", Gold: "#D4AF37", Silver: "#C0C0C0", "Rose Gold": "#D9A38F",
  Clear: "#EDEDED", Tortoise: "#6C4A2A", Natural: "#D8CDB8", Oat: "#E4D9C3", Rust: "#A44A2A", Plum: "#5A3A5C",
};
const swatch = (name) => ({ name, hex: COLORS[name] || "#CCCCCC" });

const MATERIALS = {
  clothing: ["100% organic cotton", "Linen-cotton blend", "100% linen", "Merino wool", "Recycled polyester blend", "Tencel lyocell", "Cotton twill", "Silk blend", "Wool-cashmere blend", "Stretch cotton denim"],
  bags: ["Premium vegan leather", "Full-grain leather", "Pebbled leather", "Recycled nylon", "Waxed canvas", "Woven raffia", "Suede"],
  shoes: ["Leather upper, rubber sole", "Suede upper, leather lining", "Recycled knit upper", "Vegan leather, cushioned insole", "Canvas upper, rubber sole"],
  accessories: ["18k gold-plated brass", "925 sterling silver", "Recycled acetate", "Full-grain leather", "100% wool", "Silk", "Stainless steel"],
  beauty: ["Vegan, cruelty-free", "Plant-based ingredients", "Dermatologist tested", "Fragrance-free formula"],
  home: ["Hand-glazed stoneware", "Natural soy wax", "100% cotton", "Recycled glass", "Solid oak", "Linen", "Ceramic"],
};

// ---------- product definitions: [name, subcategory, priceRange, imagePool, sizeType, collection?] ----------
const D = {
  Women: [
    ["Linen Blend Midi Dress", "Dresses", [79, 129], "womenDress"],
    ["Satin Evening Dress", "Dresses", [119, 180], "womenDress", "Evening Edit"],
    ["Wrap Front Jersey Dress", "Dresses", [59, 89], "womenDress"],
    ["Cotton Poplin Shirt Dress", "Dresses", [69, 99], "womenDress", "Office Essentials"],
    ["Ribbed Knit Bodycon Dress", "Dresses", [55, 85], "womenDress"],
    ["Floral Print Tea Dress", "Dresses", [65, 95], "womenDress", "Spring Essentials"],
    ["Tiered Cotton Maxi Dress", "Dresses", [89, 139], "womenDress", "Weekend Getaway"],
    ["Pleated Midi Dress", "Dresses", [95, 149], "womenDress"],
    ["Oversized Cotton Shirt", "Shirts", [45, 69], "womenTop", "The Everyday Edit"],
    ["Silk Blend Blouse", "Shirts", [79, 119], "womenTop", "Office Essentials"],
    ["Striped Linen Shirt", "Shirts", [55, 79], "womenTop"],
    ["Poplin Button-Down Shirt", "Shirts", [49, 75], "womenTop"],
    ["Ribbed Cotton Tank", "Tops", [22, 35], "womenTop", "Neutral Minimalism"],
    ["Boxy Cropped T-Shirt", "T-Shirts", [25, 39], "womenTop"],
    ["Organic Cotton Crew T-Shirt", "T-Shirts", [29, 42], "womenTop", "The Everyday Edit"],
    ["Square Neck Jersey Top", "Tops", [32, 49], "womenTop"],
    ["Puff Sleeve Cotton Top", "Tops", [45, 65], "womenTop", "Spring Essentials"],
    ["Halter Neck Knit Top", "Tops", [39, 59], "womenTop"],
    ["Wide Leg High-Rise Jeans", "Jeans", [69, 99], "womenBottom"],
    ["Straight Leg Cropped Jeans", "Jeans", [65, 95], "womenBottom", "The Everyday Edit"],
    ["Mom Fit Jeans", "Jeans", [59, 89], "womenBottom"],
    ["Slim Stretch Jeans", "Jeans", [55, 85], "womenBottom"],
    ["Relaxed Linen Trousers", "Trousers", [65, 95], "womenBottom", "Weekend Getaway"],
    ["Tailored Wool Trousers", "Trousers", [95, 145], "womenBottom", "Office Essentials"],
    ["Paperbag Waist Trousers", "Trousers", [59, 85], "womenBottom"],
    ["Pleated Wide Leg Trousers", "Trousers", [79, 115], "womenBottom"],
    ["Satin Bias Cut Midi Skirt", "Skirts", [59, 89], "womenBottom", "Evening Edit"],
    ["Pleated Mini Skirt", "Skirts", [45, 69], "womenBottom"],
    ["Denim Midi Skirt", "Skirts", [55, 79], "womenBottom"],
    ["Linen Wrap Skirt", "Skirts", [49, 75], "womenBottom", "Spring Essentials"],
    ["Structured Wool Coat", "Coats", [149, 180], "womenOuter"],
    ["Belted Trench Coat", "Coats", [139, 180], "womenOuter", "Office Essentials"],
    ["Longline Puffer Coat", "Coats", [129, 175], "womenOuter"],
    ["Cropped Denim Jacket", "Jackets", [69, 99], "womenOuter", "Weekend Getaway"],
    ["Oversized Linen Blazer", "Jackets", [99, 149], "womenOuter", "The Everyday Edit"],
    ["Quilted Liner Jacket", "Jackets", [85, 125], "womenOuter"],
    ["Faux Shearling Jacket", "Jackets", [119, 169], "womenOuter"],
    ["Textured Knit Cardigan", "Knitwear", [69, 99], "womenTop", "Neutral Minimalism"],
    ["Merino Wool Crew Sweater", "Knitwear", [79, 119], "womenTop"],
    ["Chunky Cable Knit Sweater", "Knitwear", [85, 129], "womenTop"],
    ["Fine Knit Roll Neck", "Knitwear", [55, 85], "womenTop", "Office Essentials"],
    ["Cotton Knit Vest", "Knitwear", [45, 69], "womenTop"],
    ["Relaxed Linen Co-ord Set", "Tops", [95, 139], "womenTop", "Weekend Getaway"],
    ["Cotton Jersey Jumpsuit", "Dresses", [79, 115], "womenDress"],
    ["Sleeveless Knit Midi Dress", "Dresses", [75, 109], "womenDress", "Neutral Minimalism"],
    ["Cotton Utility Jacket", "Jackets", [89, 129], "womenOuter"],
    ["Ruched Jersey Top", "Tops", [35, 55], "womenTop"],
    ["Linen Shorts", "Trousers", [39, 59], "womenBottom", "Weekend Getaway"],
    ["Tailored Shorts", "Trousers", [45, 69], "womenBottom"],
    ["Oversized Wool Blend Cardigan", "Knitwear", [99, 149], "womenTop"],
    ["Double Breasted Blazer", "Jackets", [119, 169], "womenOuter", "Office Essentials"],
    ["Cotton Voile Blouse", "Shirts", [49, 75], "womenTop", "Spring Essentials"],
  ],
  Men: [
    ["Classic Oxford Shirt", "Shirts", [55, 85], "menTop", "Office Essentials"],
    ["Linen Camp Collar Shirt", "Shirts", [55, 79], "menTop", "Weekend Getaway"],
    ["Brushed Flannel Shirt", "Shirts", [59, 89], "menTop"],
    ["Slim Fit Poplin Shirt", "Shirts", [49, 75], "menTop"],
    ["Denim Overshirt", "Shirts", [69, 99], "menTop", "The Everyday Edit"],
    ["Heavyweight Cotton T-Shirt", "T-Shirts", [29, 45], "menTop", "The Everyday Edit"],
    ["Organic Cotton Crew T-Shirt", "T-Shirts", [25, 39], "menTop", "Neutral Minimalism"],
    ["Striped Breton T-Shirt", "T-Shirts", [32, 49], "menTop"],
    ["Pima Cotton Polo Shirt", "T-Shirts", [45, 69], "menTop"],
    ["Long Sleeve Henley", "T-Shirts", [39, 59], "menTop"],
    ["Tailored Straight Trousers", "Trousers", [79, 119], "menBottom", "Office Essentials"],
    ["Pleated Wool Trousers", "Trousers", [95, 145], "menBottom"],
    ["Cotton Chino Trousers", "Trousers", [59, 89], "menBottom", "The Everyday Edit"],
    ["Relaxed Linen Trousers", "Trousers", [65, 95], "menBottom", "Weekend Getaway"],
    ["Drawstring Jersey Trousers", "Trousers", [49, 75], "menBottom"],
    ["Slim Tapered Jeans", "Jeans", [69, 99], "menBottom"],
    ["Straight Leg Selvedge Jeans", "Jeans", [95, 139], "menBottom"],
    ["Relaxed Fit Jeans", "Jeans", [65, 95], "menBottom", "The Everyday Edit"],
    ["Cotton Twill Shorts", "Trousers", [39, 59], "menBottom", "Weekend Getaway"],
    ["Linen Drawstring Shorts", "Trousers", [42, 65], "menBottom"],
    ["Wool Blend Overcoat", "Coats", [159, 180], "menOuter", "Office Essentials"],
    ["Cotton Mac Coat", "Coats", [139, 179], "menOuter"],
    ["Quilted Puffer Jacket", "Jackets", [119, 169], "menOuter"],
    ["Unstructured Linen Blazer", "Jackets", [119, 169], "menOuter", "Weekend Getaway"],
    ["Harrington Jacket", "Jackets", [89, 129], "menOuter"],
    ["Wool Bomber Jacket", "Jackets", [125, 175], "menOuter"],
    ["Merino Crew Neck Sweater", "Knitwear", [85, 125], "menOuter", "Neutral Minimalism"],
    ["Cotton Cable Knit Sweater", "Knitwear", [79, 115], "menOuter"],
    ["Fine Knit Half Zip", "Knitwear", [69, 99], "menOuter"],
    ["Ribbed Cardigan", "Knitwear", [75, 109], "menOuter"],
    ["Fleece Lined Hoodie", "Knitwear", [59, 89], "menOuter"],
    ["Brushed Cotton Sweatshirt", "Knitwear", [49, 75], "menOuter", "The Everyday Edit"],
    ["Corduroy Trucker Jacket", "Jackets", [99, 145], "menOuter"],
    ["Seersucker Shirt", "Shirts", [49, 75], "menTop", "Spring Essentials"],
    ["Waffle Knit T-Shirt", "T-Shirts", [35, 52], "menTop"],
    ["Garment Dyed Chinos", "Trousers", [65, 95], "menBottom"],
    ["Wool Flannel Trousers", "Trousers", [99, 149], "menBottom", "Office Essentials"],
    ["Lightweight Field Jacket", "Jackets", [109, 155], "menOuter", "Spring Essentials"],
    ["Knitted Cotton Polo", "T-Shirts", [55, 79], "menTop"],
    ["Cashmere Blend Scarf Sweater", "Knitwear", [125, 180], "menOuter"],
    ["Textured Cotton Shirt", "Shirts", [52, 79], "menTop", "Neutral Minimalism"],
    ["Loose Fit Jeans", "Jeans", [69, 99], "menBottom"],
  ],
  Bags: [
    ["Leather Crossbody Bag", "Crossbody Bags", [99, 149], "bags", "The Everyday Edit"],
    ["Luxe Leather Crossbody Bag", "Crossbody Bags", [119, 159], "bags"],
    ["Mini Structured Crossbody", "Crossbody Bags", [79, 119], "bags", "Evening Edit"],
    ["Saddle Crossbody Bag", "Crossbody Bags", [89, 129], "bags"],
    ["Classic Structured Tote", "Tote Bags", [129, 189], "bags", "Office Essentials"],
    ["Everyday Canvas Tote", "Tote Bags", [59, 85], "bags", "Weekend Getaway"],
    ["Slouchy Leather Tote", "Tote Bags", [149, 219], "bags"],
    ["Woven Raffia Tote", "Tote Bags", [69, 99], "bags", "Spring Essentials"],
    ["Quilted Shoulder Bag", "Shoulder Bags", [109, 159], "bags"],
    ["Curved Shoulder Bag", "Shoulder Bags", [95, 139], "bags", "Neutral Minimalism"],
    ["Chain Strap Shoulder Bag", "Shoulder Bags", [119, 169], "bags", "Evening Edit"],
    ["Soft Hobo Bag", "Shoulder Bags", [115, 165], "bags"],
    ["Top Handle Satchel", "Satchels", [139, 199], "bags"],
    ["Classic Satchel Bag", "Satchels", [129, 179], "bags", "Office Essentials"],
    ["Bucket Bag with Drawstring", "Bucket Bags", [99, 149], "bags"],
    ["Mini Bucket Bag", "Bucket Bags", [79, 119], "bags"],
    ["Leather Weekender", "Travel", [199, 280], "bags", "Weekend Getaway"],
    ["Nylon Travel Duffel", "Travel", [89, 139], "backpacks", "Weekend Getaway"],
    ["Minimal Leather Backpack", "Backpacks", [149, 219], "backpacks"],
    ["Roll Top Canvas Backpack", "Backpacks", [79, 119], "backpacks"],
    ["Compact City Backpack", "Backpacks", [69, 99], "backpacks", "The Everyday Edit"],
    ["Leather Belt Bag", "Belt Bags", [59, 89], "bags"],
    ["Envelope Clutch", "Clutches", [59, 95], "bags", "Evening Edit"],
    ["Pleated Satin Clutch", "Clutches", [65, 99], "bags", "Evening Edit"],
    ["Leather Card Holder", "Small Leather Goods", [29, 49], "bags"],
    ["Zip Around Wallet", "Small Leather Goods", [59, 89], "bags"],
    ["Slim Bifold Wallet", "Small Leather Goods", [45, 69], "bags"],
  ],
  Shoes: [
    ["Everyday White Sneakers", "Sneakers", [79, 109], "sneakers", "The Everyday Edit"],
    ["Clean Leather Sneakers", "Sneakers", [89, 129], "sneakers"],
    ["Retro Runner Sneakers", "Sneakers", [95, 139], "sneakers"],
    ["Canvas Low-Top Sneakers", "Sneakers", [55, 79], "sneakers", "Weekend Getaway"],
    ["Suede Court Sneakers", "Sneakers", [99, 145], "sneakers"],
    ["Knit Slip-On Sneakers", "Sneakers", [69, 99], "sneakers"],
    ["Pointed Toe Slingback Heels", "Heels", [99, 149], "heels", "Office Essentials"],
    ["Block Heel Sandals", "Heels", [89, 129], "heels"],
    ["Satin Strappy Heels", "Heels", [109, 159], "heels", "Evening Edit"],
    ["Kitten Heel Mules", "Heels", [85, 125], "heels"],
    ["Leather Chelsea Boots", "Boots", [149, 220], "boots"],
    ["Suede Ankle Boots", "Boots", [129, 189], "boots"],
    ["Knee High Leather Boots", "Boots", [179, 220], "boots"],
    ["Lace-Up Hiker Boots", "Boots", [139, 199], "boots", "Weekend Getaway"],
    ["Western Ankle Boots", "Boots", [119, 179], "boots"],
    ["Leather Penny Loafers", "Loafers", [119, 169], "boots", "Office Essentials"],
    ["Chunky Sole Loafers", "Loafers", [109, 159], "boots"],
    ["Suede Tassel Loafers", "Loafers", [125, 175], "boots"],
    ["Leather Ballet Flats", "Flats", [79, 115], "heels", "Neutral Minimalism"],
    ["Pointed Toe Flats", "Flats", [69, 99], "heels"],
    ["Mary Jane Flats", "Flats", [75, 109], "heels", "Spring Essentials"],
    ["Leather Slide Sandals", "Sandals", [59, 89], "heels", "Weekend Getaway"],
    ["Woven Leather Sandals", "Sandals", [69, 99], "heels", "Spring Essentials"],
    ["Platform Espadrilles", "Sandals", [65, 95], "heels"],
    ["Leather Derby Shoes", "Formal", [139, 199], "boots", "Office Essentials"],
    ["Cap Toe Oxford Shoes", "Formal", [149, 219], "boots"],
  ],
  Accessories: [
    ["Minimal Gold Hoops", "Jewelry", [25, 45], "jewelry", "Neutral Minimalism"],
    ["Chunky Chain Necklace", "Jewelry", [35, 59], "jewelry"],
    ["Pearl Drop Earrings", "Jewelry", [29, 49], "jewelry", "Evening Edit"],
    ["Layered Gold Necklace", "Jewelry", [39, 65], "jewelry"],
    ["Signet Ring", "Jewelry", [32, 55], "jewelry"],
    ["Stacking Ring Set", "Jewelry", [29, 49], "jewelry"],
    ["Sculptural Cuff Bracelet", "Jewelry", [45, 75], "jewelry"],
    ["Silver Bar Pendant", "Jewelry", [35, 59], "jewelry", "Office Essentials"],
    ["Silk Blend Scarf", "Scarves", [35, 59], "scarves", "Spring Essentials"],
    ["Merino Wool Scarf", "Scarves", [45, 75], "scarves"],
    ["Cashmere Blend Wrap", "Scarves", [55, 80], "scarves"],
    ["Printed Silk Bandana", "Scarves", [22, 39], "scarves"],
    ["Classic Leather Belt", "Belts", [39, 65], "scarves", "Office Essentials"],
    ["Woven Leather Belt", "Belts", [45, 69], "scarves"],
    ["Slim Suede Belt", "Belts", [35, 59], "scarves"],
    ["Round Acetate Sunglasses", "Sunglasses", [49, 80], "sunglasses", "Weekend Getaway"],
    ["Cat Eye Sunglasses", "Sunglasses", [45, 75], "sunglasses"],
    ["Aviator Sunglasses", "Sunglasses", [55, 80], "sunglasses"],
    ["Rectangle Frame Sunglasses", "Sunglasses", [49, 79], "sunglasses"],
    ["Straw Panama Hat", "Hats", [39, 65], "hats", "Weekend Getaway"],
    ["Wool Felt Fedora", "Hats", [49, 79], "hats"],
    ["Ribbed Beanie", "Hats", [19, 32], "hats"],
    ["Cotton Bucket Hat", "Hats", [25, 42], "hats", "Spring Essentials"],
    ["Minimal Leather Strap Watch", "Watches", [59, 80], "watches"],
    ["Rose Gold Mesh Watch", "Watches", [65, 80], "watches"],
    ["Leather Hair Clip", "Hair", [15, 25], "jewelry"],
    ["Silk Scrunchie Set", "Hair", [18, 29], "scarves"],
  ],
  Beauty: [
    ["Botanical Hand Wash", "Body", [18, 28], "skincare"],
    ["Nourishing Hand Cream", "Body", [14, 24], "skincare"],
    ["Hydrating Facial Serum", "Skincare", [42, 65], "skincare"],
    ["Vitamin C Day Cream", "Skincare", [38, 58], "skincare"],
    ["Gentle Cleansing Balm", "Skincare", [28, 42], "skincare"],
    ["Overnight Recovery Mask", "Skincare", [35, 55], "skincare"],
    ["Rosehip Facial Oil", "Skincare", [32, 49], "skincare"],
    ["Mineral Sunscreen SPF 50", "Skincare", [26, 39], "skincare"],
    ["Satin Finish Lipstick", "Makeup", [22, 34], "makeup"],
    ["Tinted Lip Balm", "Makeup", [16, 24], "makeup"],
    ["Cream Blush Stick", "Makeup", [24, 36], "makeup"],
    ["Brow Defining Pencil", "Makeup", [18, 28], "makeup"],
    ["Fig & Cedar Eau de Parfum", "Fragrance", [55, 75], "fragrance"],
    ["Neroli Blossom Eau de Toilette", "Fragrance", [45, 68], "fragrance"],
    ["Sandalwood Body Oil", "Body", [28, 45], "skincare"],
    ["Exfoliating Body Polish", "Body", [24, 38], "skincare"],
    ["Repair Hair Mask", "Hair", [26, 42], "skincare"],
  ],
  "Home & Living": [
    ["Minimal Ceramic Vase", "Decor", [35, 69], "decor", "Neutral Minimalism"],
    ["Ribbed Stoneware Vase", "Decor", [45, 79], "decor"],
    ["Sculptural Glass Vase", "Decor", [55, 95], "decor"],
    ["Hand-Thrown Bud Vase Set", "Decor", [39, 59], "decor"],
    ["Fig & Amber Scented Candle", "Candles", [26, 42], "candles"],
    ["Linen & Cedar Candle", "Candles", [26, 42], "candles"],
    ["Soy Wax Pillar Candle Set", "Candles", [32, 49], "candles"],
    ["Marble Candle Holder", "Candles", [29, 49], "candles"],
    ["Waffle Cotton Throw", "Textiles", [65, 99], "textiles"],
    ["Wool Blend Throw Blanket", "Textiles", [89, 139], "textiles"],
    ["Linen Cushion Cover", "Textiles", [29, 49], "textiles", "Neutral Minimalism"],
    ["Velvet Cushion Cover", "Textiles", [35, 55], "textiles"],
    ["Stonewashed Linen Bedding Set", "Textiles", [139, 200], "textiles"],
    ["Stoneware Dinner Plate Set", "Tableware", [59, 95], "tableware"],
    ["Handmade Ceramic Mug", "Tableware", [18, 29], "tableware"],
    ["Ribbed Glass Tumbler Set", "Tableware", [32, 49], "tableware"],
    ["Oak Serving Board", "Tableware", [45, 75], "tableware"],
    ["Linen Table Runner", "Tableware", [35, 55], "textiles"],
    ["Woven Seagrass Basket", "Storage", [39, 69], "decor"],
    ["Rattan Storage Tray", "Storage", [29, 49], "decor"],
    ["Ceramic Diffuser Set", "Fragrance", [42, 65], "candles"],
    ["Botanical Art Print", "Decor", [29, 59], "decor"],
  ],
};

const BRANDS = {
  Women: ["StyleUp", "StyleUp", "Atelier Nord", "Maison Ondine"],
  Men: ["StyleUp", "StyleUp", "Harbour & Co", "Atelier Nord"],
  Bags: ["StyleUp", "StyleUp", "Maison Ondine", "Ferrant"],
  Shoes: ["StyleUp", "Harbour & Co", "Ferrant"],
  Accessories: ["StyleUp", "StyleUp", "Maison Ondine", "Aure Studio"],
  Beauty: ["StyleUp Botanicals", "Aure Studio", "Lune"],
  "Home & Living": ["StyleUp Home", "StyleUp Home", "Lune", "Aure Studio"],
};
const CAT_CODE = { Women: "WM", Men: "MN", Bags: "BG", Shoes: "SH", Accessories: "AC", Beauty: "BT", "Home & Living": "HM" };

const COLOR_SETS = {
  clothing: [["Ivory", "Black", "Sage"], ["Cream", "Navy"], ["Camel", "Charcoal", "Olive"], ["Blush", "Stone"], ["Black"], ["White", "Sky Blue", "Sand"], ["Burgundy", "Forest Green", "Oat"], ["Terracotta", "Ivory"], ["Grey", "Black", "Navy"]],
  denim: [["Light Wash", "Mid Wash", "Indigo"], ["Mid Wash", "Black"], ["Indigo"]],
  bags: [["Beige", "Black", "Cognac"], ["Tan", "Chocolate"], ["Sage", "Blush", "Black"], ["Black"], ["Natural", "Camel"], ["Cream", "Forest Green"]],
  shoes: [["White"], ["Black", "Tan"], ["Cognac", "Black"], ["Sand", "Sage"], ["Chocolate"], ["Ivory", "Black"]],
  jewelry: [["Gold"], ["Gold", "Silver"], ["Rose Gold", "Gold"], ["Silver"]],
  acc: [["Tortoise", "Black"], ["Natural", "Camel"], ["Blush", "Sage", "Ivory"], ["Charcoal", "Oat"]],
  beauty: [[]],
  home: [["Cream", "Sage"], ["Natural"], ["Oat", "Terracotta"], ["Clear"], ["Stone", "Ivory"]],
};

const DESC = {
  Women: (n, m) => `${n} cut from ${m.toLowerCase()} with a relaxed, easy drape. Designed to move from weekday to weekend without a second thought.`,
  Men: (n, m) => `${n} made in ${m.toLowerCase()}. A considered fit with clean lines and details that hold up to everyday wear.`,
  Bags: (n, m) => `${n} crafted from ${m.toLowerCase()} with a structured silhouette and gold-tone hardware. Roomy enough for the essentials, refined enough for evenings.`,
  Shoes: (n, m) => `${n} built on a cushioned footbed with a ${m.toLowerCase()}. Comfortable straight out of the box and made to be worn often.`,
  Accessories: (n, m) => `${n} finished in ${m.toLowerCase()}. A small detail that pulls the whole look together.`,
  Beauty: (n, m) => `${n}, ${m.toLowerCase()}, formulated for daily use and gentle enough for sensitive skin.`,
  "Home & Living": (n, m) => `${n} in ${m.toLowerCase()}, made in small batches. Subtle variations are part of its character.`,
};
const LONG = {
  Women: "Thoughtfully patterned for a flattering, unfussy fit, this piece is one of those quiet staples that ends up on repeat. The fabric softens with every wash and the neutral palette works with almost everything already in your wardrobe. Pair it with our tailored trousers for the office or wide-leg jeans for the weekend.",
  Men: "Made for daily rotation, this piece balances a clean silhouette with practical details: reinforced seams, a comfortable rise and fabric chosen to hold its shape. Style it with chinos and clean sneakers, or layer it under a wool overcoat when the weather turns.",
  Bags: "Designed around how you actually carry your day: a main compartment sized for a small tablet, an internal zip pocket for keys and cards, and a slip pocket for your phone. The strap adjusts for shoulder or crossbody wear and the base is reinforced so the bag keeps its shape when set down.",
  Shoes: "Built on a last we refined over several seasons, these shoes offer a true-to-size fit with a slightly padded collar and a flexible, grippy sole. The upper is lined for breathability and the insole can be removed if you prefer your own orthotics.",
  Accessories: "Crafted in small quantities with a focus on materials that age well. Comes packaged in an StyleUp pouch, so it's ready to gift or to keep for yourself.",
  Beauty: "Developed with our in-house formulators and tested on real skin, not just in the lab. Free from parabens, sulphates and synthetic fragrance. Packaged in recyclable glass and post-consumer plastic.",
  "Home & Living": "Each piece is finished by hand, so slight variations in glaze, weave or grain are expected and welcomed. Designed to sit comfortably alongside the rest of our home collection with a warm, neutral palette.",
};
const CARE = {
  clothing: ["Machine wash cold. Lay flat to dry.", "Machine wash 30°C. Do not tumble dry.", "Dry clean only.", "Hand wash cold. Reshape while damp."],
  bags: ["Wipe with a soft dry cloth.", "Store in dust bag when not in use.", "Spot clean with damp cloth. Avoid prolonged sun exposure."],
  shoes: ["Wipe clean with a damp cloth.", "Use a suede brush to lift marks.", "Apply leather conditioner every few months."],
  accessories: ["Store away from moisture.", "Wipe with a soft polishing cloth.", "Hand wash cold."],
  beauty: ["Store in a cool, dry place.", "For external use only.", "Use within 12 months of opening."],
  home: ["Wipe clean with a damp cloth.", "Machine wash cold, gentle cycle.", "Dishwasher safe.", "Trim wick to 5mm before each burn."],
};

const TAGS_POOL = ["everyday", "minimal", "office", "weekend", "layering", "essentials", "occasion", "summer", "autumn", "neutral", "gift", "new-season", "classic", "relaxed", "tailored"];

const REVIEWERS = ["Sophia M.", "Olivia R.", "Emma T.", "Ava L.", "Isabella K.", "Mia H.", "Charlotte D.", "Amelia P.", "Harper S.", "Evelyn B.", "James W.", "Liam O.", "Noah C.", "Oliver G.", "Elijah F.", "Lucas N.", "Mason V.", "Ethan J.", "Zara A.", "Priya S.", "Hana Y.", "Léa M.", "Sofía G.", "Yuki T."];
const REVIEW_TITLES = ["Exactly what I hoped for", "Great quality", "Fits perfectly", "Lovely everyday piece", "Worth every penny", "Better in person", "Runs slightly small", "My new favourite", "Beautiful finish", "Good, not perfect", "Would buy again", "Very comfortable"];
const REVIEW_TEXT = [
  "The quality is exceptional and it goes with everything I own. Already thinking about ordering a second one.",
  "True to size and the colour is exactly as pictured. Arrived quickly and well packaged.",
  "Looks even better in person. The material feels premium and the details are lovely.",
  "Really pleased with this. I'd suggest sizing up if you're between sizes.",
  "Simple, well made and clearly designed with care. It has become part of my weekly rotation.",
  "Good overall, though I expected the colour to be slightly warmer. Still very happy with the purchase.",
  "Comfortable from the first wear. The fit is relaxed without being baggy.",
  "Gift for my sister and she loved it. The packaging was a nice touch.",
  "Exactly as described. Solid construction and a nice weight to it.",
  "Took a star off because delivery took a little longer than expected, but the product itself is excellent.",
];

// ---------- helpers ----------
const roundPrice = (n) => {
  const r = Math.round(n);
  const opts = [r - (r % 5) - 1, r - (r % 10) + 9, r];
  const v = pick(opts);
  return Math.max(12, v);
};

function sizesFor(category, sub, name) {
  if (category === "Women" || category === "Men") {
    if (/Belt|Scarf|Scrunchie|Hair Clip|Bandana/.test(name)) return [];
    return CLOTH_SIZES;
  }
  if (category === "Shoes") {
    if (/Heels|Flats|Mary Jane|Slingback|Ballet|Mules/.test(name)) return SHOE_W;
    if (/Derby|Oxford|Chelsea|Penny|Tassel/.test(name)) return SHOE_M;
    return SHOE_U;
  }
  if (category === "Accessories") {
    if (/Belt/.test(name)) return ["S", "M", "L"];
    if (/Ring/.test(name)) return ["6", "7", "8"];
    if (/Hat|Fedora|Beanie/.test(name)) return ["S/M", "M/L"];
    return [];
  }
  if (category === "Beauty") {
    if (/Parfum|Toilette/.test(name)) return ["30ml", "50ml", "100ml"];
    if (/Serum|Oil/.test(name)) return ["30ml"];
    if (/Candle/.test(name)) return ["Standard"];
    return [];
  }
  if (category === "Home & Living") {
    if (/Cushion|Throw|Bedding|Runner/.test(name)) return ["Standard", "Large"];
    if (/Vase|Basket|Tray|Print/.test(name)) return ["Small", "Medium", "Large"];
    return [];
  }
  return [];
}
function colorsFor(category, sub) {
  if (category === "Women" || category === "Men") return pick(/Jeans|Denim/.test(sub) ? COLOR_SETS.denim : COLOR_SETS.clothing);
  if (category === "Bags") return pick(COLOR_SETS.bags);
  if (category === "Shoes") return pick(COLOR_SETS.shoes);
  if (category === "Accessories") return pick(sub === "Jewelry" || sub === "Watches" ? COLOR_SETS.jewelry : COLOR_SETS.acc);
  if (category === "Beauty") return [];
  return pick(COLOR_SETS.home);
}
function matKey(category) {
  return { Women: "clothing", Men: "clothing", Bags: "bags", Shoes: "shoes", Accessories: "accessories", Beauty: "beauty", "Home & Living": "home" }[category];
}
function dimensionsFor(category, sub) {
  if (category === "Bags") return `${int(18, 40)} × ${int(12, 30)} × ${int(6, 16)} cm`;
  if (category === "Home & Living") return /Cushion/.test(sub) ? "50 × 50 cm" : /Throw/.test(sub) ? "130 × 170 cm" : `${int(10, 35)} × ${int(10, 35)} cm`;
  if (category === "Accessories" && /Sunglasses|Watches/.test(sub)) return `${int(38, 52)} mm`;
  if (category === "Beauty") return null;
  return null;
}
function weightFor(category) {
  return { Women: `${int(180, 900)} g`, Men: `${int(200, 1100)} g`, Bags: `${int(350, 1200)} g`, Shoes: `${int(500, 1100)} g`, Accessories: `${int(20, 250)} g`, Beauty: `${int(40, 250)} g`, "Home & Living": `${int(150, 2500)} g` }[category];
}

// Distribute "states" so ~20% new, ~15% sale, ~15% best seller, ~5% low stock, ~5% out of stock
function buildProducts() {
  const products = [];
  let counter = 0;
  const startDate = new Date("2026-01-05");
  const TODAY = new Date("2026-09-03");

  for (const [category, defs] of Object.entries(D)) {
    const code = CAT_CODE[category];
    const defsShuffled = defs; // keep listing order stable
    defsShuffled.forEach((def, i) => {
      const [name, sub, [pmin, pmax], pool, , collection] = def;
      counter++;
      const id = counter;
      const sku = `SH-${code}-${String(i + 1).padStart(3, "0")}`;
      const brand = pick(BRANDS[category]);
      const material = pick(MATERIALS[matKey(category)]);
      const regular = roundPrice(between(pmin, pmax));
      const isSale = chance(0.15);
      const discountPct = isSale ? pick([10, 15, 20, 25, 30, 40]) : 0;
      const sale = isSale ? Math.round(regular * (1 - discountPct / 100) * 100) / 100 : null;
      const isNew = !isSale && chance(0.24);
      const isBest = chance(0.16);
      const stockRoll = rand();
      const stockState = stockRoll < 0.05 ? "out" : stockRoll < 0.11 ? "low" : "in";
      const colors = colorsFor(category, sub);
      const sizes = sizesFor(category, sub, name);

      // images: 2–6 from pool, first is thumbnail, second is hover
      const poolIds = shuffle(IMG[pool]);
      const imgCount = Math.min(poolIds.length, pick([2, 3, 3, 4, 4, 5, 6]));
      const images = poolIds.slice(0, imgCount).map((pid, idx) => ({
        src: img(pid),
        srcset: `${img(pid, 400)} 400w, ${img(pid, 800)} 800w, ${img(pid, 1200)} 1200w`,
        alt: `${name} in ${colors[0]?.toLowerCase?.() || category.toLowerCase()} — ${["front", "back", "side", "detail", "lifestyle", "inside"][idx] || "view"}`,
      }));

      // variant-level inventory
      const variants = [];
      const colorList = colors.length ? colors : [null];
      const sizeList = sizes.length ? sizes : [null];
      for (const c of colorList) {
        for (const s of sizeList) {
          let qty;
          if (stockState === "out") qty = 0;
          else if (stockState === "low") qty = int(0, 4);
          else qty = chance(0.12) ? 0 : int(4, 60);
          variants.push({ color: c, size: s, stock: qty });
        }
      }
      // guarantee at least something in stock for "low"
      if (stockState === "low" && variants.every((v) => v.stock === 0)) variants[0].stock = int(1, 4);
      const stock_quantity = variants.reduce((a, v) => a + v.stock, 0);

      const ratingBase = isBest ? between(4.4, 4.9) : between(3.6, 4.9);
      const rating = Math.round(ratingBase * 10) / 10;
      const review_count = chance(0.06) ? 0 : isBest ? int(180, 1400) : int(3, 260);
      const created = new Date(startDate.getTime() + (isNew ? int(200, 240) : int(0, 199)) * 86400000);

      // reviews (a handful of full reviews, distribution computed from count)
      const reviews = [];
      const reviewSample = Math.min(review_count, pick([2, 3, 3, 4, 5]));
      for (let r = 0; r < reviewSample; r++) {
        const stars = rand() < 0.75 ? 5 : rand() < 0.7 ? 4 : 3;
        reviews.push({
          id: `${sku}-R${r + 1}`,
          author: pick(REVIEWERS),
          verified: chance(0.85),
          rating: stars,
          title: pick(REVIEW_TITLES),
          text: pick(REVIEW_TEXT),
          date: new Date(Math.min(TODAY.getTime() - int(1, 40) * 86400000, created.getTime() + int(2, 120) * 86400000)).toISOString().slice(0, 10),
        });
      }
      const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      if (review_count) {
        const p5 = (rating - 3) / 2; // rough
        dist[5] = Math.round(review_count * Math.min(0.78, Math.max(0.3, p5)));
        dist[4] = Math.round((review_count - dist[5]) * 0.55);
        const rest = Math.max(0, review_count - dist[5] - dist[4]);
        dist[3] = Math.round(rest * 0.6);
        dist[2] = Math.round(rest * 0.25);
        dist[1] = rest - dist[3] - dist[2];
      }

      const tags = shuffle(TAGS_POOL).slice(0, int(2, 4));
      const desc = DESC[category](name, material);

      products.push({
        product_id: id,
        SKU: sku,
        product_name: name,
        slug: slugify(name) + (defs.filter((d) => d[0] === name).length > 1 || products.some((p) => p.slug === slugify(name)) ? `-${code.toLowerCase()}` : ""),
        category,
        category_slug: slugify(category),
        subcategory: sub,
        subcategory_slug: slugify(sub),
        brand,
        short_description: desc,
        full_description: LONG[category],
        regular_price: regular,
        sale_price: sale,
        currency: "USD",
        discount_percentage: discountPct,
        rating: review_count ? rating : 0,
        review_count,
        stock_quantity,
        availability: stock_quantity === 0 ? "out_of_stock" : stock_quantity < 5 ? "low_stock" : "in_stock",
        featured: chance(0.18),
        new_arrival: isNew,
        best_seller: isBest,
        sale_status: isSale,
        materials: material,
        care_instructions: pick(CARE[matKey(category)]),
        dimensions: dimensionsFor(category, sub),
        weight: weightFor(category),
        colors: colors.map(swatch),
        sizes,
        variants,
        tags,
        collection: collection || null,
        images,
        // Populate with { src, poster?, type?, alt? } when product media is available.
        video: null,
        thumbnail: images[0].src,
        hover_image: images[1]?.src || null,
        created_date: created.toISOString().slice(0, 10),
        reviews,
        rating_distribution: dist,
        installments: regular >= 40,
      });
    });
  }
  return products;
}

const products = buildProducts();

// sanity checks
const names = new Set(products.map((p) => p.product_name + p.category));
if (names.size !== products.length) throw new Error("duplicate product names");
const slugs = new Set(products.map((p) => p.slug));
if (slugs.size !== products.length) throw new Error("duplicate slugs");
for (const p of products) if (p.sale_price !== null && p.sale_price >= p.regular_price) throw new Error("bad sale price " + p.SKU);

const out = resolve(__dirname, "../src/data/products.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(products));

const byCat = {};
for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
const stat = (k) => products.filter((p) => p[k]).length;
console.log(`Generated ${products.length} products`, byCat);
console.log({ new: stat("new_arrival"), sale: stat("sale_status"), best: stat("best_seller"), low: products.filter((p) => p.availability === "low_stock").length, out: products.filter((p) => p.availability === "out_of_stock").length, noReviews: products.filter((p) => !p.review_count).length });
