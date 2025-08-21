const mysql = require('mysql2');

const testServerDatabase = async () => {
  console.log('🔍 Sunucu Veritabanı Testi Başlatılıyor...');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'smstk_db'
  };
  
  console.log('📋 Konfigürasyon:', {
    host: config.host,
    user: config.user,
    port: config.port,
    database: config.database,
    password: config.password ? '***' : 'undefined'
  });
  
  try {
    // Test connection
    const connection = mysql.createConnection(config);
    await connection.promise().connect();
    console.log('✅ Veritabanı bağlantısı başarılı');
    
    // Check tables
    const [tables] = await connection.promise().query('SHOW TABLES');
    console.log(`📊 Tablolar (${tables.length}):`, tables.map(t => Object.values(t)[0]));
    
    // Check data in each table
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      const [count] = await connection.promise().query(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`📋 ${tableName}: ${count[0].count} kayıt`);
      
      // Show sample data for important tables
      if (['users', 'categories', 'products', 'suppliers'].includes(tableName)) {
        const [sample] = await connection.promise().query(`SELECT * FROM ${tableName} LIMIT 3`);
        console.log(`   Örnek veriler:`, sample);
      }
    }
    
    // Test specific queries
    console.log('\n🔍 API Endpoint Testleri:');
    
    // Users test
    try {
      const [users] = await connection.promise().query('SELECT id, username, role FROM users WHERE is_active = 1');
      console.log(`✅ Users API: ${users.length} aktif kullanıcı`);
    } catch (e) {
      console.log(`❌ Users API hatası:`, e.message);
    }
    
    // Categories test
    try {
      const [categories] = await connection.promise().query('SELECT * FROM categories WHERE is_active = 1');
      console.log(`✅ Categories API: ${categories.length} kategori`);
    } catch (e) {
      console.log(`❌ Categories API hatası:`, e.message);
    }
    
    // Products test
    try {
      const [products] = await connection.promise().query('SELECT * FROM products WHERE is_active = 1');
      console.log(`✅ Products API: ${products.length} ürün`);
    } catch (e) {
      console.log(`❌ Products API hatası:`, e.message);
    }
    
    // Dashboard test
    try {
      const [dashboard] = await connection.promise().query(`
        SELECT 
          (SELECT COUNT(*) FROM products WHERE is_active = 1) as total_products,
          (SELECT COUNT(*) FROM categories WHERE is_active = 1) as total_categories,
          (SELECT COUNT(*) FROM suppliers WHERE is_active = 1) as total_suppliers,
          (SELECT COUNT(*) FROM stock_movements WHERE DATE(created_at) = CURDATE()) as today_movements
      `);
      console.log(`✅ Dashboard API:`, dashboard[0]);
    } catch (e) {
      console.log(`❌ Dashboard API hatası:`, e.message);
    }
    
    await connection.promise().end();
    
  } catch (error) {
    console.error('❌ Veritabanı test hatası:', error.message);
    console.error('🔧 Hata detayları:', error);
  }
};

// Run test
testServerDatabase();
