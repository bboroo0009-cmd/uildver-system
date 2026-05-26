-- Хэрэглэгчид (Admin, Үйлдвэр, Борлуулагч)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(128),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'uildver', 'borluulagch')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Бүтээгдэхүүний төрөл (домбо, айрагны хувин, мөнгөн аяга)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Аль хэдийн үүссэн products table-д шинэ багана нэмэх
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0);

-- Агуулахын нөөц (үйлдвэрт хэдэн ширхэг үлдэгдэлтэй)
CREATE TABLE IF NOT EXISTS warehouse_stock (
  product_id INTEGER PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Борлуулагчид (хүн эсвэл дэлгүүр)
CREATE TABLE IF NOT EXISTS distributors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  phone VARCHAR(32),
  location VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Борлуулагч бүрд хэдэн ширхэг өгсөн нөөц байгаа
CREATE TABLE IF NOT EXISTS distributor_stock (
  distributor_id INTEGER NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (distributor_id, product_id)
);

-- Гүйлгээний түүх (үйлдвэрлэл, борлуулагч руу шилжүүлэх, борлуулсан)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  distributor_id INTEGER REFERENCES distributors(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('produce', 'transfer', 'sell', 'return')),
  quantity INTEGER NOT NULL,
  note TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_product ON transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_tx_distributor ON transactions(distributor_id);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at DESC);
