export type RegionId = 'tr' | 'us';

export interface Category {
  name: string;
  rate?: number;
  min_fee?: number;
  per_order_fee?: number;
  isDynamic?: boolean;
  rule?: string;
}

export interface Marketplace {
  id: string;
  name: string;
  categories: Category[];
}

export interface Region {
  id: RegionId;
  label: string;
  currency: string;
  symbol: string;
  marketplaces: Marketplace[];
  inputs: {
    purchase: { label: string; suffix: string };
    sale: { label: string; suffix: string };
    shipping: { label: string; suffix: string };
    tax: { label: string; suffix: string };
    other: { label: string; suffix: string };
    returnRate: { label: string; suffix: string };
  };
}

export const MARKETPLACE_COMMISSIONS: Record<string, Category[]> = {
  amazon_us: [
    { name: 'Amazon Device Accessories', rate: 45.0, min_fee: 0.30 },
    { name: 'Automotive and Powersports', rate: 12.0, min_fee: 0.30 },
    { name: 'Baby Products', rate: 15.0, min_fee: 0.30 },
    { name: 'Backpacks, Handbags, and Luggage', rate: 15.0, min_fee: 0.30 },
    { name: 'Base Equipment Power Tools', rate: 12.0, min_fee: 0.30 },
    { name: 'Beauty, Health and Personal Care', rate: 15.0, min_fee: 0.30 },
    { name: 'Business, Industrial, and Scientific Supplies', rate: 12.0, min_fee: 0.30 },
    { name: 'Clothing and Accessories', rate: 17.0, min_fee: 0.30 },
    { name: 'Compact Appliances', rate: 15.0, min_fee: 0.30 },
    { name: 'Computers', rate: 8.0, min_fee: 0.30 },
    { name: 'Consumer Electronics', rate: 8.0, min_fee: 0.30 },
    { name: 'Electronics Accessories', rate: 15.0, min_fee: 0.30 },
    { name: 'Everything Else', rate: 15.0, min_fee: 0.30 },
    { name: 'Eyewear', rate: 15.0, min_fee: 0.30 },
    { name: 'Fine Art', rate: 20.0, min_fee: 0.0 },
    { name: 'Footwear', rate: 15.0, min_fee: 0.30 },
    { name: 'Full-Size Appliances', rate: 8.0, min_fee: 0.30 },
    { name: 'Furniture', rate: 15.0, min_fee: 0.30 },
    { name: 'Gift Cards', rate: 20.0, min_fee: 0.0 },
    { name: 'Grocery and Gourmet', rate: 15.0, min_fee: 0.0 },
    { name: 'Home and Kitchen', rate: 15.0, min_fee: 0.30 },
    { name: 'Jewelry', rate: 20.0, min_fee: 0.30 },
    { name: 'Lawn and Garden', rate: 15.0, min_fee: 0.30 },
    { name: 'Lawn Mowers and Snow Throwers', rate: 15.0, min_fee: 0.30 },
    { name: 'Mattresses', rate: 15.0, min_fee: 0.30 },
    { name: 'Media - Books, DVD, Music, Software, Video', rate: 15.0, min_fee: 0.0 },
    { name: 'Merchant Fulfilled Services', rate: 20.0, min_fee: 0.30 },
    { name: 'Musical Instruments and AV Production', rate: 15.0, min_fee: 0.30 },
    { name: 'Office Products', rate: 15.0, min_fee: 0.30 },
    { name: 'Pet Products', rate: 22.0, min_fee: 0.30 },
    { name: 'Sports and Outdoors', rate: 15.0, min_fee: 0.30 },
    { name: 'Tires', rate: 10.0, min_fee: 0.30 },
    { name: 'Tools and Home Improvement', rate: 15.0, min_fee: 0.30 },
    { name: 'Toys and Games', rate: 15.0, min_fee: 0.30 },
    { name: 'Video Game Consoles', rate: 8.0, min_fee: 0.0 },
    { name: 'Video Games and Gaming Accessories', rate: 15.0, min_fee: 0.0 },
    { name: 'Watches', rate: 16.0, min_fee: 0.30 },
  ],
  ebay: [
    { name: 'Antiques', rate: 15.0, per_order_fee: 0.30 },
    { name: 'Art', rate: 15.0, per_order_fee: 0.30 },
    { name: 'Baby', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Books', rate: 14.6, per_order_fee: 0.30 },
    { name: 'Clothing, Shoes & Accessories', rate: 15.0, per_order_fee: 0.30 },
    { name: 'Coins & Paper Money', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Collectibles', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Computers/Tablets & Networking', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Consumer Electronics', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Crafts', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Dolls & Bears', rate: 13.25, per_order_fee: 0.30 },
    { name: 'DVDs & Movies', rate: 14.6, per_order_fee: 0.30 },
    { name: 'Entertainment Memorabilia', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Gift Cards & Coupons', rate: 10.0, per_order_fee: 0.30 },
    { name: 'Health & Beauty', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Home & Garden', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Jewelry & Watches', rate: 15.0, per_order_fee: 0.30 },
    { name: 'Musical Instruments & Gear', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Pet Supplies', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Sporting Goods', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Sports Mem, Cards & Fan Shop', rate: 15.0, per_order_fee: 0.30 },
    { name: 'Toys & Hobbies', rate: 13.25, per_order_fee: 0.30 },
    { name: 'Vehicle Parts & Accessories', rate: 13.0, per_order_fee: 0.30 },
    { name: 'Video Games & Consoles', rate: 13.25, per_order_fee: 0.30 },
  ],
  etsy: [
    { name: 'Standart', rate: 21.5, per_order_fee: 0.20 },
  ],
  trendyol: [
    { name: 'Altın (İşlenmemiş)', rate: 9.0 },
    { name: 'Ayakkabı', rate: 22.5 },
    { name: 'Giyim', rate: 22.5 },
    { name: 'Çanta ve Bavul', rate: 22.5 },
    { name: 'Atkı, Bere, Eldiven', rate: 21.5 },
    { name: 'Diğer Aksesuar (Kemer, Şapka)', rate: 22.5 },
    { name: 'Cep Telefonu', rate: 6.0 },
    { name: 'Bilgisayar ve Tablet', rate: 10.0 },
    { name: 'Televizyon', rate: 8.0 },
    { name: 'Beyaz Eşya', rate: 11.0 },
    { name: 'Küçük Ev Aletleri', rate: 18.0 },
    { name: 'Kozmetik ve Kişisel Bakım', rate: 20.0 },
    { name: 'Parfüm', rate: 19.0 },
    { name: 'Ev Tekstili', rate: 22.0 },
    { name: 'Mobilya', rate: 22.0 },
    { name: 'Züccaciye', rate: 22.0 },
    { name: 'Oyuncak', rate: 22.0 },
    { name: 'Spor ve Outdoor', rate: 20.0 },
    { name: 'Kitap ve Kırtasiye', rate: 15.0 },
    { name: 'Süpermarket / Gıda', rate: 15.0 },
    { name: 'Telefon Yedek Parça', rate: 27.0 },
    { name: 'Takı ve Bijuteri', rate: 23.0 },
  ],
  hepsiburada: [
    { name: 'Altın Yatırım', rate: 6.0 },
    { name: 'Takı & Mücevher', rate: 18.64 },
    { name: 'Saat & Gözlük', rate: 18.0 },
    { name: 'Aksesuar (Atkı, Bere vb.)', rate: 18.0 },
    { name: 'Valiz & Bavul', rate: 18.0 },
    { name: 'Çanta', rate: 18.0 },
    { name: 'Ayakkabı', rate: 19.49 },
    { name: 'Giyim', rate: 18.0 },
    { name: 'Bebek Giyim', rate: 18.0 },
    { name: 'Parfüm', rate: 17.0 },
    { name: 'Outdoor-Deniz Ekipmanları (Genel)', rate: 14.0 },
    { name: 'Outdoor-Deniz Ekipmanları (Tekne/GPS)', rate: 12.0 },
    { name: 'Spor & Outdoor Giyim/Ayakkabı', rate: 18.0 },
    { name: 'Tekne, Motor, Balık Bulucu', rate: 8.47 },
    { name: 'Koşu Bandı & Kondisyon Bisikleti', rate: 10.0 },
    { name: 'Fitness & Kondisyon Ekipmanları', rate: 13.0 },
    { name: 'Bisiklet & Paten', rate: 10.0 },
    { name: 'Spor Branşları Ekipmanları', rate: 13.0 },
    { name: 'Taraftar Ürünleri', rate: 18.0 },
    { name: 'Cep Telefonu', rate: 7.0 },
    { name: 'Yenilenmiş/Tuşlu Telefon', rate: 8.5 },
    { name: 'Tablet & Taşınabilir Bilgisayar', rate: 7.0 },
    { name: 'Bilgisayar Bileşenleri (SSD, Ram, Kasa vb.)', rate: 10.0 },
    { name: 'Masaüstü Bilgisayar & Server', rate: 7.0 },
    { name: 'Dokunmatik Pos PC', rate: 17.0 },
    { name: 'Projeksiyon Cihazı & Aksesuarları', rate: 11.0 },
    { name: 'Yazıcılar', rate: 10.0 },
    { name: 'Toner, Kartuş & Yedek Parça', rate: 12.0 },
    { name: 'Ağ/Modem & Çevre Birimleri', rate: 10.0 },
    { name: 'Bilgisayar Yazılımı', rate: 10.0 },
    { name: 'Fotoğraf Makinesi & Kamera', rate: 10.0 },
    { name: 'Drone', rate: 10.0 },
    { name: 'Drone Aksesuarları', rate: 15.0 },
    { name: 'Oto Ses & Navigasyon', rate: 12.0 },
    { name: 'Oto Yedek Parça', rate: 20.0 },
    { name: 'Oto Lastik', rate: 9.0 },
    { name: 'Beyaz Eşya', rate: 10.0 },
    { name: 'LCD/LED/Smart TV', rate: 6.78 },
    { name: 'Anne & Bebek Bakım', rate: 18.0 },
    { name: 'Bebek Mamaları', rate: 11.0 },
    { name: 'Kozmetik (Cilt/Saç/Makyaj)', rate: 17.0 },
    { name: 'Petshop (Mama)', rate: 14.0 },
    { name: 'Petshop (Aksesuar)', rate: 17.0 },
    { name: 'Ev Bakım & Temizlik', rate: 15.0 },
    { name: 'Gıda & İçecek', rate: 17.0 },
    { name: 'Bahçe Mobilyası', rate: 18.0 },
    { name: 'Hırdavat & Yapı Market', rate: 18.0 },
    { name: 'Aydınlatma', rate: 18.0 },
    { name: 'Ev Tekstili', rate: 18.0 },
    { name: 'Mobilya', rate: 18.0 },
    { name: 'Züccaciye', rate: 18.0 },
    { name: 'Oyuncak', rate: 18.0 },
    { name: 'Kırtasiye', rate: 17.0 },
    { name: 'Kitap', rate: 15.0 },
    { name: 'Dijital Ürünler', rate: 8.05 },
  ],
  n11: [
    { name: 'Giyim & Moda - Genel', rate: 20.34 },
    { name: 'Giyim & Moda - Abiye/Düğün', rate: 21.0 },
    { name: 'Kadın Çanta', rate: 18.0 },
    { name: 'Ayakkabı Bakım Ürünleri', rate: 19.0 },
    { name: 'Güneş Gözlüğü', rate: 20.34 },
    { name: 'Gümüş & Çelik Takılar', rate: 21.0 },
    { name: 'Kozmetik & Kişisel Bakım', rate: 16.0 },
    { name: 'Saç Bakım & Şekillendirme', rate: 16.0 },
    { name: 'Ev Tekstili', rate: 20.0 },
    { name: 'Dekorasyon & Aydınlatma', rate: 23.0 },
    { name: 'Mobilya (Bahçe)', rate: 19.0 },
    { name: 'Mutfak Gereçleri', rate: 18.0 },
    { name: 'Anne & Bebek Bakım', rate: 18.0 },
    { name: 'Bebek Arabası', rate: 18.0 },
    { name: 'Bilgisayar Sarf Malzemeleri', rate: 18.0 },
    { name: 'TV & Ses Sistemleri', rate: 20.0 },
    { name: 'Fotoğraf & Kamera Aksesuarları', rate: 15.0 },
    { name: 'Beyaz Eşya', rate: 13.0 },
    { name: 'Oto Aksesuar', rate: 14.0 },
    { name: 'Motosiklet Ekipmanları', rate: 10.5 },
    { name: 'Otomotiv Yedek Parça', rate: 14.0 },
    { name: 'Kitap & Film', rate: 15.0 },
    { name: 'Kağıt Ürünleri', rate: 17.0 },
    { name: 'Hobi ve El İşi', rate: 18.0 },
    { name: 'Evcil Hayvan Ürünleri', rate: 18.0 },
    { name: 'Antika & Koleksiyon', rate: 20.34 },
  ],
  amazon_tr: [
    { name: 'Kamera', rate: 9 },
    { name: 'Ev Eğlence Sistemleri', rate: 11.5 },
    { name: 'Cep Telefonu', rate: 8 },
    { name: 'Giyim', rate: 15.5 },
    { name: 'Bilgisayar', rate: 7 },
    { name: 'Tüketici Elektroniği', rate: 9.5 },
    { name: 'Elektronik Aksesuarlar', rate: 11 },
    { name: 'Kişisel Bakım Aletleri', rate: 13.6 },
    { name: 'Ev Geliştirme', rate: 12.7 },
    { name: 'Mutfak Gereçleri ve Dekorasyon', rate: 15 },
    { name: 'Mobilya', rate: 14.5 },
    { name: 'Mutfak (Küçük Ev Aletleri)', rate: 11 },
    { name: 'Büyük Ev Aletleri', rate: 7 },
    { name: 'Müzik Aletleri', rate: 10 },
    { name: 'Oyuncak ve Oyun', rate: 13 },
    { name: 'Kitap', rate: 10.2 },
    { name: 'Bebek Ürünleri', rate: 11.5 },
    { name: 'Ofis Ürünleri', rate: 13 },
    { name: 'Spor', rate: 10 },
    { name: 'Ayakkabı, Çanta ve Aksesuarları', rate: 17 },
    { name: 'Saat', rate: 15.5 },
    { name: 'Valiz/Çanta', rate: 16 },
    { name: 'Evcil Hayvan Ürünleri', rate: 13.5 },
    { name: 'Bahçe', rate: 14 },
    { name: 'Oyun Konsolları', rate: 8.5 },
    { name: 'Video Oyunları', rate: 10 },
    { name: 'Otomotiv', rate: 12.5 },
    { name: 'Diğer Her Şey', rate: 10 },
    { name: 'Sağlık ve Kişisel Bakım', rate: 13.5 },
    { name: 'Güzellik', isDynamic: true, rule: 'p <= 500 ? 9 : 14' },
    { name: 'Gıda', isDynamic: true, rule: 'p <= 500 ? 9 : 13' },
    { name: 'Mücevher', isDynamic: true, rule: 'p <= 900 ? 20 : 6' },
  ],
};

export const REGIONS: Record<RegionId, Region> = {
  tr: {
    id: 'tr',
    label: 'Türkiye',
    currency: 'TL',
    symbol: '₺',
    marketplaces: [
      { id: 'trendyol', name: 'Trendyol', categories: MARKETPLACE_COMMISSIONS.trendyol },
      { id: 'hepsiburada', name: 'Hepsiburada', categories: MARKETPLACE_COMMISSIONS.hepsiburada },
      { id: 'amazon_tr', name: 'Amazon TR', categories: MARKETPLACE_COMMISSIONS.amazon_tr },
      { id: 'n11', name: 'N11', categories: MARKETPLACE_COMMISSIONS.n11 },
      { id: 'manuel', name: 'Manuel', categories: [] },
    ],
    inputs: {
      purchase: { label: 'Üretim Maliyeti', suffix: 'TL' },
      sale: { label: 'Satış Fiyatı', suffix: 'TL' },
      shipping: { label: 'Nakliye', suffix: 'TL' },
      tax: { label: 'KDV Oranı', suffix: '%' },
      other: { label: 'Diğer Maliyetler', suffix: 'TL' },
      returnRate: { label: 'İade Oranı', suffix: '%' },
    },
  },
  us: {
    id: 'us',
    label: 'Amerika (US)',
    currency: 'USD',
    symbol: '$',
    marketplaces: [
      { id: 'amazon_us', name: 'Amazon US', categories: MARKETPLACE_COMMISSIONS.amazon_us },
      { id: 'etsy', name: 'Etsy', categories: MARKETPLACE_COMMISSIONS.etsy },
      { id: 'ebay', name: 'eBay', categories: MARKETPLACE_COMMISSIONS.ebay },
      { id: 'manuel', name: 'Manuel', categories: [] },
    ],
    inputs: {
      purchase: { label: 'Üretim Maliyeti', suffix: '$' },
      sale: { label: 'Satış Fiyatı', suffix: '$' },
      shipping: { label: 'Nakliye', suffix: '$' },
      tax: { label: 'Tahmini Vergi / Eyalet Vergisi', suffix: '%' },
      other: { label: 'Diğer Maliyetler', suffix: '$' },
      returnRate: { label: 'İade Oranı', suffix: '%' },
    },
  },
};

export type FulfillmentMode = 'fbm' | 'fba';
export type FBAMethod = 'asin' | 'manual';

export interface FBAInputs {
  unit: 'cm' | 'in';
  width: string;
  length: string;
  height: string;
  weightUnit: 'kg' | 'lb';
  weight: string;
  fulfillmentCost: string;
  storageCost: string;
  inboundingCost: string;
  miscCost: string;
}

export interface CalcResult {
  netProfit: number;
  margin: number;
  breakEvenPrice: number;
  costRatio: number;
  commissionAmount: number;
  taxAmount: number;
  returnCost: number;
  totalCost: number;
  isLoss: boolean;
  fbaCosts?: {
    fulfillment: number;
    storage: number;
    inbounding: number;
    misc: number;
    total: number;
  };
}

export interface ASINData {
  asin: string;
  title: string;
  category: string;
  fbaFulfillmentFee: number;
  storageFee: number;
  inboundingFee: number;
  miscFee: number;
  commissionRate: number;
  costPerUnit: number;
}

const MOCK_ASIN_DB_US: Record<string, ASINData> = {
  B08N5WRWNW: {
    asin: 'B08N5WRWNW', title: 'Apple AirPods Max', category: 'Consumer Electronics',
    fbaFulfillmentFee: 5.21, storageFee: 2.40, inboundingFee: 1.80, miscFee: 0.50, commissionRate: 8.0,
    costPerUnit: 9.91,
  },
  B09G9F5Y18: {
    asin: 'B09G9F5Y18', title: 'Apple iPhone 13 Pro', category: 'Consumer Electronics',
    fbaFulfillmentFee: 5.21, storageFee: 1.80, inboundingFee: 2.20, miscFee: 0.75, commissionRate: 8.0,
    costPerUnit: 9.96,
  },
  B07ZPKN856: {
    asin: 'B07ZPKN856', title: 'Sony WH-1000XM4 Headphones', category: 'Electronics Accessories',
    fbaFulfillmentFee: 3.06, storageFee: 1.20, inboundingFee: 0.90, miscFee: 0.35, commissionRate: 15.0,
    costPerUnit: 5.51,
  },
};

const MOCK_ASIN_DB_TR: Record<string, ASINData> = {
  B08N5WRWNW: {
    asin: 'B08N5WRWNW', title: 'Apple AirPods Max', category: 'Tüketici Elektroniği',
    fbaFulfillmentFee: 22, storageFee: 8, inboundingFee: 7.50, miscFee: 2, commissionRate: 9.5,
    costPerUnit: 39.50,
  },
  B09G9F5Y18: {
    asin: 'B09G9F5Y18', title: 'Apple iPhone 13 Pro', category: 'Cep Telefonu',
    fbaFulfillmentFee: 22, storageFee: 6, inboundingFee: 7.50, miscFee: 3, commissionRate: 8.0,
    costPerUnit: 38.50,
  },
  B07ZPKN856: {
    asin: 'B07ZPKN856', title: 'Sony WH-1000XM4 Headphones', category: 'Elektronik Aksesuarlar',
    fbaFulfillmentFee: 14, storageFee: 4, inboundingFee: 3.75, miscFee: 1.50, commissionRate: 11.0,
    costPerUnit: 23.25,
  },
};

export function lookupASIN(asin: string, region: RegionId = 'us'): ASINData {
  const clean = asin.trim().toUpperCase();
  const db = region === 'tr' ? MOCK_ASIN_DB_TR : MOCK_ASIN_DB_US;

  if (db[clean]) return db[clean];

  const seed = clean.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = (min: number, max: number) => {
    const x = Math.sin(seed * 9301 + min * 49297 + max * 233280) * 10000;
    return Math.round((x - Math.floor(x)) * (max - min) * 100) / 100 + min;
  };

  if (region === 'tr') {
    const cats = ['Tüketici Elektroniği', 'Giyim', 'Ev Geliştirme', 'Oyuncak ve Oyun', 'Spor'];
    const fbaFee = rng(14, 80);
    const storage = rng(3, 25);
    const inbounding = rng(3.75, 40);
    const misc = rng(1, 10);
    return {
      asin: clean,
      title: `Ürün ${clean}`,
      category: cats[seed % cats.length],
      fbaFulfillmentFee: fbaFee,
      storageFee: storage,
      inboundingFee: inbounding,
      miscFee: misc,
      commissionRate: [9.5, 15.5, 12.7, 13, 10][seed % 5],
      costPerUnit: fbaFee + storage + inbounding + misc,
    };
  }

  const cats = ['Home and Kitchen', 'Clothing and Accessories', 'Beauty, Health and Personal Care', 'Toys and Games', 'Sports and Outdoors'];
  const fbaFee = rng(3.5, 8.5);
  const storage = rng(0.8, 3.0);
  const inbounding = rng(0.5, 2.5);
  const misc = rng(0.2, 1.5);
  return {
    asin: clean,
    title: `Ürün ${clean}`,
    category: cats[seed % cats.length],
    fbaFulfillmentFee: fbaFee,
    storageFee: storage,
    inboundingFee: inbounding,
    miscFee: misc,
    commissionRate: [15.0, 17.0, 8.0, 12.0, 22.0][seed % 5],
    costPerUnit: fbaFee + storage + inbounding + misc,
  };
}

export function resolveCommissionRate(category: Category, salePrice: number): number {
  if (category.isDynamic && category.rule) {
    const p = salePrice;
    try {
      const match = category.rule.match(/p\s*<=\s*(\d+)\s*\?\s*([\d.]+)\s*:\s*([\d.]+)/);
      if (match) {
        const threshold = parseFloat(match[1]);
        const lowRate = parseFloat(match[2]);
        const highRate = parseFloat(match[3]);
        return p <= threshold ? lowRate : highRate;
      }
    } catch { /* fall through */ }
  }
  return category.rate ?? 0;
}

interface SizeTier {
  name: string;
  maxLength: number;
  maxMedian: number;
  maxShortest: number;
  maxWeight: number;
  fulfillment: number;
  storagePerCubicFt: number;
}

const US_TIERS: SizeTier[] = [
  { name: 'Small Standard', maxLength: 15, maxMedian: 12, maxShortest: 0.75, maxWeight: 1, fulfillment: 3.06, storagePerCubicFt: 2.40 },
  { name: 'Large Standard', maxLength: 18, maxMedian: 14, maxShortest: 8, maxWeight: 20, fulfillment: 5.21, storagePerCubicFt: 2.40 },
  { name: 'Small Oversize', maxLength: 61, maxMedian: 30, maxShortest: 6, maxWeight: 70, fulfillment: 8.26, storagePerCubicFt: 1.80 },
  { name: 'Medium Oversize', maxLength: 62, maxMedian: 46, maxShortest: 25, maxWeight: 150, fulfillment: 10.53, storagePerCubicFt: 1.80 },
  { name: 'Large Oversize', maxLength: 84, maxMedian: 72, maxShortest: 50, maxWeight: 150, fulfillment: 13.56, storagePerCubicFt: 1.80 },
];

interface SizeTierTR {
  name: string;
  maxLength: number;
  maxMedian: number;
  maxShortest: number;
  maxWeight: number;
  fulfillment: number;
  storagePerCubicMeter: number;
}

const TR_TIERS: SizeTierTR[] = [
  { name: 'Small Standard', maxLength: 38, maxMedian: 30, maxShortest: 2, maxWeight: 0.5, fulfillment: 14, storagePerCubicMeter: 300 },
  { name: 'Large Standard', maxLength: 46, maxMedian: 36, maxShortest: 20, maxWeight: 9, fulfillment: 22, storagePerCubicMeter: 300 },
  { name: 'Small Oversize', maxLength: 155, maxMedian: 76, maxShortest: 15, maxWeight: 32, fulfillment: 45, storagePerCubicMeter: 225 },
  { name: 'Medium Oversize', maxLength: 157, maxMedian: 117, maxShortest: 64, maxWeight: 68, fulfillment: 60, storagePerCubicMeter: 225 },
  { name: 'Large Oversize', maxLength: 213, maxMedian: 183, maxShortest: 127, maxWeight: 68, fulfillment: 80, storagePerCubicMeter: 225 },
];

export function determineFBATier(
  region: RegionId,
  w: number, l: number, h: number, weight: number,
  unit: 'cm' | 'in', weightUnit: 'kg' | 'lb',
): { tier: string; fulfillment: number; storage: number } {
  let dims: [number, number, number];
  let wgt: number;

  if (region === 'us') {
    dims = unit === 'cm' ? [w / 2.54, l / 2.54, h / 2.54] : [w, l, h];
    wgt = weightUnit === 'kg' ? weight * 2.20462 : weight;
    const sorted = [...dims].sort((a, b) => b - a);
    const [longest, median, shortest] = sorted;
    const volumeCubicFt = (dims[0] * dims[1] * dims[2]) / 1728;
    for (const tier of US_TIERS) {
      if (longest <= tier.maxLength && median <= tier.maxMedian && shortest <= tier.maxShortest && wgt <= tier.maxWeight) {
        return { tier: tier.name, fulfillment: tier.fulfillment, storage: volumeCubicFt * tier.storagePerCubicFt };
      }
    }
    const last = US_TIERS[US_TIERS.length - 1];
    return { tier: last.name, fulfillment: last.fulfillment, storage: volumeCubicFt * last.storagePerCubicFt };
  } else {
    dims = unit === 'in' ? [w * 2.54, l * 2.54, h * 2.54] : [w, l, h];
    wgt = weightUnit === 'lb' ? weight / 2.20462 : weight;
    const sorted = [...dims].sort((a, b) => b - a);
    const [longest, median, shortest] = sorted;
    const volumeCubicM = (dims[0] * dims[1] * dims[2]) / 1_000_000;
    for (const tier of TR_TIERS) {
      if (longest <= tier.maxLength && median <= tier.maxMedian && shortest <= tier.maxShortest && wgt <= tier.maxWeight) {
        return { tier: tier.name, fulfillment: tier.fulfillment, storage: volumeCubicM * tier.storagePerCubicMeter };
      }
    }
    const last = TR_TIERS[TR_TIERS.length - 1];
    return { tier: last.name, fulfillment: last.fulfillment, storage: volumeCubicM * last.storagePerCubicMeter };
  }
}

export function calcInboundingCost(region: RegionId, weight: number, weightUnit: 'kg' | 'lb'): number {
  if (region === 'us') {
    const lbs = weightUnit === 'kg' ? weight * 2.20462 : weight;
    return lbs * 0.40;
  } else {
    const kgs = weightUnit === 'lb' ? weight / 2.20462 : weight;
    return kgs * 15;
  }
}

export function calculate(
  purchase: number,
  sale: number,
  shipping: number,
  taxRate: number,
  commissionRate: number,
  returnRate: number = 0,
  fbaCosts?: { fulfillment: number; storage: number; inbounding: number; misc: number },
  otherCosts?: number,
): CalcResult {
  const commissionAmount = (sale * commissionRate) / 100;
  const taxAmount = (sale * taxRate) / 100;
  const returnCost = (sale * returnRate) / 100;

  let fbaTotal = 0;
  if (fbaCosts) {
    fbaTotal = fbaCosts.fulfillment + fbaCosts.storage + fbaCosts.inbounding + fbaCosts.misc;
  }

  const otherTotal = otherCosts ?? 0;

  const totalCost = purchase + shipping + commissionAmount + taxAmount + returnCost + fbaTotal + otherTotal;
  const netProfit = sale - totalCost;
  const margin = sale > 0 ? (netProfit / sale) * 100 : 0;
  const costRatio = sale > 0 ? (totalCost / sale) * 100 : 0;

  const variableRate = (commissionRate + taxRate + returnRate) / 100;
  const fixedCosts = purchase + shipping + otherTotal + fbaTotal;
  const breakEvenPrice = variableRate < 1 ? fixedCosts / (1 - variableRate) : fixedCosts;

  return {
    netProfit,
    margin,
    breakEvenPrice,
    costRatio,
    commissionAmount,
    taxAmount,
    returnCost,
    totalCost,
    isLoss: netProfit < 0,
    fbaCosts: fbaCosts ? { ...fbaCosts, total: fbaTotal } : undefined,
  };
}

export function calcDesi(w: number, l: number, h: number, divisor: number): number {
  return (w * l * h) / divisor;
}
