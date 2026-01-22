// Smart categorization keyword mappings
// Keywords are matched case-insensitively against merchant names

const categoryKeywords = {
  food: [
    // Supermarkets TR
    'migros', 'carrefour', 'a101', 'bim', 'şok', 'sok', 'market', 'macro', 'metro',
    'file', 'happy center', 'kipa', 'tansaş', 'gratis',
    // Supermarkets International
    'walmart', 'tesco', 'aldi', 'lidl', 'costco', 'whole foods',
    // Restaurants & Cafes
    'restaurant', 'restoran', 'cafe', 'kahve', 'starbucks', 'mcdonald', 'burger king',
    'kfc', 'dominos', 'pizza', 'kebab', 'döner', 'doner', 'yemek', 'food',
    'getir', 'yemeksepeti', 'trendyol yemek', 'uber eats', 'deliveroo',
    // Bakery
    'bakery', 'fırın', 'pastane', 'simit sarayı'
  ],

  transport: [
    // Fuel
    'shell', 'opet', 'bp', 'petrol', 'benzin', 'total', 'po', 'aytemiz',
    // Ride sharing
    'uber', 'bolt', 'bitaksi', 'taxi', 'taksi',
    // Public transport
    'metro', 'iett', 'otobüs', 'otobus', 'tramvay', 'marmaray', 'istanbulkart',
    'ankarakart', 'izmirim kart', 'akbil',
    // Parking
    'otopark', 'ispark', 'parking',
    // Airlines & Travel
    'thy', 'turkish airlines', 'pegasus', 'anadolujet', 'sunexpress',
    'bilet', 'ticket', 'obilet', 'flixbus'
  ],

  entertainment: [
    // Streaming
    'spotify', 'netflix', 'youtube', 'disney', 'amazon prime', 'hbo', 'apple tv',
    'blutv', 'exxen', 'gain', 'mubi', 'puhutv',
    // Gaming
    'ps store', 'playstation', 'xbox', 'steam', 'epic games', 'nintendo',
    'riot games', 'blizzard', 'ea games',
    // Cinema & Events
    'cinema', 'sinema', 'cinemaximum', 'mars cinema', 'biletix', 'passo',
    'konser', 'concert', 'tiyatro', 'theatre',
    // Books & Media
    'kitap', 'book', 'd&r', 'idefix', 'kitapyurdu', 'audible', 'kindle'
  ],

  bills: [
    // Electricity
    'electric', 'elektrik', 'enerjisa', 'başkent elektrik', 'gediz', 'toroslar',
    // Water
    'su', 'water', 'iski', 'aski', 'izsu',
    // Gas
    'gas', 'doğalgaz', 'dogalgaz', 'igdaş', 'baskentgaz', 'izgas',
    // Internet & Phone
    'internet', 'telefon', 'turkcell', 'vodafone', 'türk telekom', 'turk telekom',
    'superonline', 'ttnet',
    // Insurance
    'sigorta', 'insurance', 'axa', 'allianz', 'anadolu sigorta',
    // Rent
    'kira', 'rent', 'aidat'
  ],

  shopping: [
    // E-commerce TR
    'trendyol', 'hepsiburada', 'n11', 'gittigidiyor', 'çiçeksepeti', 'ciceksepeti',
    // E-commerce International
    'amazon', 'ebay', 'aliexpress', 'shein', 'temu',
    // Fashion
    'zara', 'h&m', 'lcw', 'lc waikiki', 'defacto', 'koton', 'mavi', 'colins',
    'boyner', 'vakko', 'beymen', 'network', 'ipekyol',
    // Electronics
    'mediamarkt', 'teknosa', 'vatan', 'apple store', 'samsung',
    // Home
    'ikea', 'koçtaş', 'bauhaus', 'tekzen', 'english home', 'madame coco'
  ],

  health: [
    // Pharmacy
    'pharmacy', 'eczane', 'eczacı', 'ilac', 'ilaç',
    // Hospital & Clinic
    'hospital', 'hastane', 'klinik', 'clinic', 'sağlık', 'saglik',
    'acıbadem', 'acibadem', 'memorial', 'medical park', 'liv hospital',
    // Doctor
    'doctor', 'doktor', 'dr.', 'diş', 'dis', 'dentist',
    // Fitness
    'gym', 'spor', 'fitness', 'mac fit', 'sports international'
  ],

  education: [
    // Schools & Courses
    'okul', 'school', 'üniversite', 'universite', 'university', 'kolej', 'college',
    'kurs', 'course', 'eğitim', 'egitim', 'education',
    // Online Learning
    'udemy', 'coursera', 'skillshare', 'masterclass', 'linkedin learning',
    // Language
    'dil kursu', 'language', 'ingilizce', 'english'
  ],

  income: [
    'salary', 'maaş', 'maas', 'ücret', 'ucret', 'wage',
    'bonus', 'prim', 'ikramiye',
    'freelance', 'serbest',
    'dividend', 'temettü', 'temettu',
    'refund', 'iade', 'cashback',
    'transfer', 'havale', 'eft'
  ],

  investment: [
    'yatırım', 'yatirim', 'investment',
    'hisse', 'stock', 'borsa', 'bist',
    'kripto', 'crypto', 'bitcoin', 'ethereum',
    'altın', 'altin', 'gold',
    'döviz', 'doviz', 'forex', 'usd', 'eur'
  ]
};

// Default category when no match found
const DEFAULT_CATEGORY = 'uncategorized';

// Category display info
const categoryInfo = {
  food: { icon: '🍔', color: '#FF6B6B', label: 'Food & Dining' },
  transport: { icon: '🚗', color: '#4ECDC4', label: 'Transportation' },
  entertainment: { icon: '🎬', color: '#9B59B6', label: 'Entertainment' },
  bills: { icon: '📄', color: '#3498DB', label: 'Bills & Utilities' },
  shopping: { icon: '🛍️', color: '#E91E63', label: 'Shopping' },
  health: { icon: '💊', color: '#2ECC71', label: 'Health & Fitness' },
  education: { icon: '📚', color: '#F39C12', label: 'Education' },
  income: { icon: '💰', color: '#27AE60', label: 'Income' },
  investment: { icon: '📈', color: '#8E44AD', label: 'Investment' },
  uncategorized: { icon: '❓', color: '#95A5A6', label: 'Uncategorized' }
};

module.exports = {
  categoryKeywords,
  categoryInfo,
  DEFAULT_CATEGORY
};
