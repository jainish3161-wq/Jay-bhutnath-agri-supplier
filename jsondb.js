/**
 * jsondb.js — JSON file-based database for Jay Bhutnath Agri Suppler
 * Zero native dependencies. Data stored in server/data/*.json files.
 */
const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

class Collection {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this._data    = this._load();
    this._nextId  = this._data.length > 0 ? Math.max(...this._data.map(r => r.id || 0)) + 1 : 1;
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath))
        return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch (e) { console.error('DB load error:', e.message); }
    return [];
  }

  _save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this._data, null, 2), 'utf8');
  }

  all(predicate) {
    return predicate ? this._data.filter(predicate) : [...this._data];
  }

  findOne(predicate) {
    return this._data.find(predicate) || null;
  }

  insert(record) {
    const now = new Date().toISOString();
    const row = { id: this._nextId++, created_at: now, updated_at: now, ...record };
    this._data.push(row);
    this._save();
    return row;
  }

  update(id, updates) {
    const idx = this._data.findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    this._data[idx] = { ...this._data[idx], ...updates, updated_at: new Date().toISOString() };
    this._save();
    return this._data[idx];
  }

  delete(id) {
    const idx = this._data.findIndex(r => r.id === Number(id));
    if (idx === -1) return false;
    this._data.splice(idx, 1);
    this._save();
    return true;
  }

  count(predicate) {
    return predicate ? this._data.filter(predicate).length : this._data.length;
  }

  upsert(predicate, record) {
    const existing = this.findOne(predicate);
    if (existing) return this.update(existing.id, record);
    return this.insert(record);
  }
}

// ─── Collections ─────────────────────────────────────────────────────────────
const db = {
  products:         new Collection('products'),
  orders:           new Collection('orders'),
  farmers:          new Collection('farmers'),
  contacts:         new Collection('contacts'),
  prices:           new Collection('prices'),
  tokens:           new Collection('tokens'),
  delivery:         new Collection('delivery'),
  deliveryPartners: new Collection('delivery_partners'),
};

// ─── Seed ────────────────────────────────────────────────────────────────────
function seedData() {
  if (db.products.count() === 0) {
    [
      { name:'Lokwan Wheat',       name_gu:'લોકવન ઘઉં',      category:'Wheat',     price_per_kg:28,  price_per_quintal:2800, image_emoji:'🌾', min_order_kg:50,  in_stock:1, description:'Premium Lokwan wheat from Kutch.',       description_gu:'કચ્છની પ્રીમિયમ લોકવન ઘઉં.' },
      { name:'Wheat Flour (Atta)', name_gu:'ઘઉંનો લોટ',      category:'Flour',     price_per_kg:35,  price_per_quintal:3500, image_emoji:'🫓', min_order_kg:25,  in_stock:1, description:'Stone-ground whole wheat flour.',        description_gu:'ઘઉંનો આખો દળેલો લોટ.' },
      { name:'Castor Seeds',       name_gu:'એરંડાના બીજ',    category:'Oil Seeds', price_per_kg:72,  price_per_quintal:7200, image_emoji:'🌻', min_order_kg:100, in_stock:1, description:'High-yield castor seeds from Kutch.',    description_gu:'કચ્છના ઉચ્ચ ઉત્પાદક એરંડા.' },
      { name:'Groundnuts',         name_gu:'મગફળી',          category:'Oil Seeds', price_per_kg:65,  price_per_quintal:6500, image_emoji:'🥜', min_order_kg:50,  in_stock:1, description:'Fresh groundnuts, rich oil content.',    description_gu:'તાજી, ઉચ્ચ તેલ-ઉત્પાદક મગફળી.' },
      { name:'Cattle Feed',        name_gu:'પશુ આહાર',       category:'Feed',      price_per_kg:18,  price_per_quintal:1800, image_emoji:'🐄', min_order_kg:200, in_stock:1, description:'Nutritious balanced cattle feed.',       description_gu:'સંતુલિત પૌષ્ટિક પશુ આહાર.' },
      { name:'Sesame Seeds',       name_gu:'તલ',             category:'Oil Seeds', price_per_kg:85,  price_per_quintal:8500, image_emoji:'🌱', min_order_kg:50,  in_stock:1, description:'Premium white sesame seeds.',            description_gu:'સ્વચ્છ સફેદ તલ.' },
    ].forEach(p => db.products.insert(p));
    console.log('✅ Seeded 6 products');
  }

  if (db.prices.count() === 0) {
    const today = new Date().toISOString().split('T')[0];
    [
      { product_name:'Lokwan Wheat',       product_name_gu:'લોકવન ઘઉં',   category:'Wheat',     price_per_quintal:2800, change_amount:50,   market:'Mandvi Mandi', price_date:today },
      { product_name:'Wheat Flour (Atta)', product_name_gu:'ઘઉંનો લોટ',   category:'Flour',     price_per_quintal:3500, change_amount:-25,  market:'Mandvi Mandi', price_date:today },
      { product_name:'Castor Seeds',       product_name_gu:'એરંડાના બીજ', category:'Oil Seeds', price_per_quintal:7200, change_amount:150,  market:'Mandvi Mandi', price_date:today },
      { product_name:'Groundnuts',         product_name_gu:'મગફળી',        category:'Oil Seeds', price_per_quintal:6500, change_amount:-100, market:'Mandvi Mandi', price_date:today },
      { product_name:'Cattle Feed',        product_name_gu:'પશુ આહાર',    category:'Feed',      price_per_quintal:1800, change_amount:0,    market:'Mandvi Mandi', price_date:today },
      { product_name:'Sesame Seeds',       product_name_gu:'તલ',           category:'Oil Seeds', price_per_quintal:8500, change_amount:200,  market:'Mandvi Mandi', price_date:today },
    ].forEach(p => db.prices.insert(p));
    console.log('✅ Seeded market prices');
  }

  // Seed a demo delivery partner
  if (db.deliveryPartners.count() === 0) {
    db.deliveryPartners.insert({ name:'Demo Driver', phone:'9000000000', pin:'1234', vehicle_number:'GJ-12-AB-1234', status:'active', area:'Mandvi' });
    console.log('✅ Seeded demo delivery partner (phone: 9000000000, PIN: 1234)');
  }
}

seedData();
module.exports = db;
