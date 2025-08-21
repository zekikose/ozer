const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 8889,
  database: process.env.DB_NAME || 'smstk_db',
  socketPath: process.env.NODE_ENV === 'development' ? '/Applications/MAMP/tmp/mysql/mysql.sock' : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Test connection
const testConnection = async () => {
  try {
    const [rows] = await promisePool.execute('SELECT 1');
    console.log('✅ Database connection test successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    // Users table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'manager', 'stock_keeper', 'viewer') DEFAULT 'viewer',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Suppliers table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Warehouses table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(200),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        sku VARCHAR(50) UNIQUE NOT NULL,
        barcode VARCHAR(100),
        description TEXT,
        category_id INT,
        supplier_id INT,
        warehouse_id INT,
        unit_price DECIMAL(10,2) DEFAULT 0.00,
        cost_price DECIMAL(10,2) DEFAULT 0.00,
        min_stock_level INT DEFAULT 0,
        max_stock_level INT DEFAULT 1000,
        current_stock INT DEFAULT 0,
        unit VARCHAR(20) DEFAULT 'piece',
        image_url VARCHAR(500),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL
      )
    `);

    // Customers table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Stock movements table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        movement_type ENUM('in', 'out', 'adjustment') NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        reference_number VARCHAR(50),
        notes TEXT,
        user_id INT,
        supplier_id INT,
        customer_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
      )
    `);

    // Purchase orders table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        supplier_id INT NOT NULL,
        total_amount DECIMAL(10,2) DEFAULT 0.00,
        status ENUM('pending', 'approved', 'received', 'cancelled') DEFAULT 'pending',
        order_date DATE NOT NULL,
        expected_delivery_date DATE,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Purchase order items table
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        purchase_order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        received_quantity INT DEFAULT 0,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Create demo user if not exists
    await createDemoUser();

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Create demo user
const createDemoUser = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await promisePool.execute(`
      INSERT IGNORE INTO users (username, email, password, full_name, role) 
      VALUES ('admin', 'admin@smstk.com', ?, 'Admin User', 'admin')
    `, [hashedPassword]);
    
    console.log('✅ Demo user created successfully');
  } catch (error) {
    console.error('❌ Demo user creation failed:', error);
  }
};

module.exports = {
  pool: promisePool,
  connect: (callback) => {
    testConnection().then(success => {
      if (success) {
        initDatabase().then(() => {
          callback(null);
        }).catch(callback);
      } else {
        callback(new Error('Database connection failed'));
      }
    });
  }
}; 