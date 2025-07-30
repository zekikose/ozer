require('dotenv').config({ path: './config.env' });
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Demo veriler ekleniyor...');

    // Demo kategoriler
    const categories = [
      { name: 'Elektronik', description: 'Elektronik ürünler' },
      { name: 'Gıda', description: 'Gıda ürünleri' },
      { name: 'Tekstil', description: 'Tekstil ürünleri' },
      { name: 'Ev & Yaşam', description: 'Ev ve yaşam ürünleri' }
    ];

    for (const category of categories) {
      await pool.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description]
      );
    }
    console.log('✅ Kategoriler eklendi');

    // Demo tedarikçiler
    const suppliers = [
      { name: 'TechCorp', contact_person: 'Ahmet Yılmaz', email: 'ahmet@techcorp.com', phone: '0212 555 0101', address: 'İstanbul, Türkiye' },
      { name: 'FoodSupply', contact_person: 'Fatma Demir', email: 'fatma@foodsupply.com', phone: '0216 555 0202', address: 'İstanbul, Türkiye' },
      { name: 'TextilePro', contact_person: 'Mehmet Kaya', email: 'mehmet@textilepro.com', phone: '0232 555 0303', address: 'İzmir, Türkiye' }
    ];

    for (const supplier of suppliers) {
      await pool.execute(
        'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [supplier.name, supplier.contact_person, supplier.email, supplier.phone, supplier.address]
      );
    }
    console.log('✅ Tedarikçiler eklendi');

    // Demo depolar
    const warehouses = [
      { name: 'Ana Depo', location: 'İstanbul, Avcılar', description: 'Ana stok deposu' },
      { name: 'Şube Depo', location: 'İzmir, Bornova', description: 'Şube deposu' },
      { name: 'Soğuk Hava Deposu', location: 'İstanbul, Tuzla', description: 'Gıda ürünleri için soğuk hava deposu' }
    ];

    for (const warehouse of warehouses) {
      await pool.execute(
        'INSERT INTO warehouses (name, location, description) VALUES (?, ?, ?)',
        [warehouse.name, warehouse.location, warehouse.description]
      );
    }
    console.log('✅ Depolar eklendi');

    // Demo müşteriler
    const customers = [
      { name: 'ABC Mağazası', contact_person: 'Ali Veli', email: 'ali@abcmagaza.com', phone: '0212 555 0404', address: 'İstanbul, Kadıköy' },
      { name: 'XYZ Market', contact_person: 'Ayşe Öz', email: 'ayse@xyzmarket.com', phone: '0216 555 0505', address: 'İstanbul, Üsküdar' },
      { name: 'DEF Tekstil', contact_person: 'Can Yıldız', email: 'can@deftekstil.com', phone: '0232 555 0606', address: 'İzmir, Konak' }
    ];

    for (const customer of customers) {
      await pool.execute(
        'INSERT INTO customers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
        [customer.name, customer.contact_person, customer.email, customer.phone, customer.address]
      );
    }
    console.log('✅ Müşteriler eklendi');

    // Demo ürünler
    const products = [
      {
        name: 'iPhone 15',
        sku: 'IPH15-001',
        barcode: '1234567890123',
        description: 'Apple iPhone 15 128GB',
        category_id: 1,
        supplier_id: 1,
        warehouse_id: 1,
        unit_price: 40000.00,
        cost_price: 35000.00,
        min_stock_level: 5,
        max_stock_level: 50,
        current_stock: 30,
        unit: 'adet'
      },
      {
        name: 'Samsung TV',
        sku: 'SAMS-TV-001',
        barcode: '1234567890124',
        description: 'Samsung 55" Smart TV',
        category_id: 1,
        supplier_id: 1,
        warehouse_id: 1,
        unit_price: 12000.00,
        cost_price: 10000.00,
        min_stock_level: 3,
        max_stock_level: 20,
        current_stock: 15,
        unit: 'adet'
      },
      {
        name: 'Ekmek',
        sku: 'GIDA-EKM-001',
        barcode: '1234567890125',
        description: 'Taze ekmek',
        category_id: 2,
        supplier_id: 2,
        warehouse_id: 3,
        unit_price: 3.00,
        cost_price: 2.00,
        min_stock_level: 50,
        max_stock_level: 200,
        current_stock: 100,
        unit: 'adet'
      },
      {
        name: 'Süt',
        sku: 'GIDA-SUT-001',
        barcode: '1234567890126',
        description: 'Günlük süt 1L',
        category_id: 2,
        supplier_id: 2,
        warehouse_id: 3,
        unit_price: 10.00,
        cost_price: 7.00,
        min_stock_level: 20,
        max_stock_level: 100,
        current_stock: 200,
        unit: 'adet'
      },
      {
        name: 'T-Shirt',
        sku: 'TEXT-TSH-001',
        barcode: '1234567890127',
        description: 'Pamuklu t-shirt',
        category_id: 3,
        supplier_id: 3,
        warehouse_id: 2,
        unit_price: 30.00,
        cost_price: 20.00,
        min_stock_level: 10,
        max_stock_level: 100,
        current_stock: 100,
        unit: 'adet'
      }
    ];

    for (const product of products) {
      await pool.execute(
        `INSERT INTO products (
          name, sku, barcode, description, category_id, supplier_id, warehouse_id,
          unit_price, cost_price, min_stock_level, max_stock_level, current_stock, unit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.name, product.sku, product.barcode, product.description,
          product.category_id, product.supplier_id, product.warehouse_id,
          product.unit_price, product.cost_price, product.min_stock_level,
          product.max_stock_level, product.current_stock, product.unit
        ]
      );
    }
    console.log('✅ Ürünler eklendi');

    // Demo kullanıcılar
    const users = [
      { username: 'manager', email: 'manager@smstk.com', full_name: 'Manager User', password: 'password', role: 'manager' },
      { username: 'stock_keeper', email: 'stock@smstk.com', full_name: 'Stock Keeper', password: 'password', role: 'stock_keeper' },
      { username: 'viewer', email: 'viewer@smstk.com', full_name: 'Viewer User', password: 'password', role: 'viewer' }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      await pool.execute(
        'INSERT INTO users (username, email, full_name, password, role) VALUES (?, ?, ?, ?, ?)',
        [user.username, user.email, user.full_name, hashedPassword, user.role]
      );
    }
    console.log('✅ Kullanıcılar eklendi');

    // Demo stok hareketleri
    const stockMovements = [
      {
        product_id: 1,
        movement_type: 'in',
        quantity: 30,
        unit_price: 40000.00,
        total_amount: 1200000.00,
        reference_number: 'PO-001',
        notes: 'İlk stok girişi',
        user_id: 1,
        supplier_id: 1
      },
      {
        product_id: 2,
        movement_type: 'in',
        quantity: 15,
        unit_price: 12000.00,
        total_amount: 180000.00,
        reference_number: 'PO-002',
        notes: 'TV stok girişi',
        user_id: 1,
        supplier_id: 1
      },
      {
        product_id: 3,
        movement_type: 'in',
        quantity: 100,
        unit_price: 3.00,
        total_amount: 300.00,
        reference_number: 'PO-003',
        notes: 'Ekmek stok girişi',
        user_id: 1,
        supplier_id: 2
      },
      {
        product_id: 4,
        movement_type: 'in',
        quantity: 200,
        unit_price: 10.00,
        total_amount: 2000.00,
        reference_number: 'PO-004',
        notes: 'Süt stok girişi',
        user_id: 1,
        supplier_id: 2
      },
      {
        product_id: 5,
        movement_type: 'in',
        quantity: 100,
        unit_price: 30.00,
        total_amount: 3000.00,
        reference_number: 'PO-005',
        notes: 'T-shirt stok girişi',
        user_id: 1,
        supplier_id: 3
      },
      {
        product_id: 1,
        movement_type: 'out',
        quantity: 5,
        unit_price: 45000.00,
        total_amount: 225000.00,
        reference_number: 'SO-001',
        notes: 'Satış',
        user_id: 1,
        customer_id: 1
      },
      {
        product_id: 2,
        movement_type: 'out',
        quantity: 7,
        unit_price: 15000.00,
        total_amount: 105000.00,
        reference_number: 'SO-002',
        notes: 'Satış',
        user_id: 1,
        customer_id: 2
      },
      {
        product_id: 3,
        movement_type: 'out',
        quantity: 50,
        unit_price: 5.00,
        total_amount: 250.00,
        reference_number: 'SO-003',
        notes: 'Günlük satış',
        user_id: 1,
        customer_id: 1
      },
      {
        product_id: 4,
        movement_type: 'out',
        quantity: 125,
        unit_price: 15.00,
        total_amount: 1875.00,
        reference_number: 'SO-004',
        notes: 'Günlük satış',
        user_id: 1,
        customer_id: 2
      },
      {
        product_id: 5,
        movement_type: 'out',
        quantity: 40,
        unit_price: 50.00,
        total_amount: 2000.00,
        reference_number: 'SO-005',
        notes: 'Satış',
        user_id: 1,
        customer_id: 3
      }
    ];

    for (const movement of stockMovements) {
      await pool.execute(
        `INSERT INTO stock_movements (
          product_id, movement_type, quantity, unit_price, total_amount,
          reference_number, notes, user_id, supplier_id, customer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movement.product_id, movement.movement_type, movement.quantity,
          movement.unit_price, movement.total_amount, movement.reference_number,
          movement.notes, movement.user_id, 
          movement.supplier_id || null, 
          movement.customer_id || null
        ]
      );
    }
    console.log('✅ Stok hareketleri eklendi');

    console.log('🎉 Tüm demo veriler başarıyla eklendi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Demo veri ekleme hatası:', error);
    process.exit(1);
  }
};

seedData(); 