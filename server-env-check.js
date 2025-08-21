const mysql = require('mysql2');

// Test connection function
const testDatabaseConnection = async () => {
  console.log('🔍 Veritabanı bağlantı testi başlatılıyor...');
  
  // Environment variables
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
    // Test connection without database first
    const testConnection = mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port
    });
    
    console.log('🔌 MySQL sunucusuna bağlanılıyor...');
    await testConnection.promise().connect();
    console.log('✅ MySQL sunucusuna bağlantı başarılı');
    
    // Check if database exists
    const [databases] = await testConnection.promise().query('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === config.database);
    
    if (!dbExists) {
      console.log(`❌ Veritabanı '${config.database}' bulunamadı`);
      console.log('📋 Mevcut veritabanları:', databases.map(db => db.Database));
      
      // Create database
      console.log(`🔨 Veritabanı '${config.database}' oluşturuluyor...`);
      await testConnection.promise().query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
      console.log(`✅ Veritabanı '${config.database}' oluşturuldu`);
    } else {
      console.log(`✅ Veritabanı '${config.database}' mevcut`);
    }
    
    await testConnection.promise().end();
    
    // Test connection with database
    const dbConnection = mysql.createConnection(config);
    await dbConnection.promise().connect();
    console.log(`✅ Veritabanı '${config.database}' bağlantısı başarılı`);
    
    // Check tables
    const [tables] = await dbConnection.promise().query('SHOW TABLES');
    console.log(`📊 Mevcut tablolar (${tables.length}):`, tables.map(t => Object.values(t)[0]));
    
    await dbConnection.promise().end();
    
  } catch (error) {
    console.error('❌ Veritabanı bağlantı hatası:', error.message);
    console.error('🔧 Hata detayları:', error);
    
    // Common solutions
    console.log('\n🔧 Olası çözümler:');
    console.log('1. MySQL servisinin çalıştığından emin olun');
    console.log('2. Kullanıcı adı ve şifrenin doğru olduğunu kontrol edin');
    console.log('3. Port numarasının doğru olduğunu kontrol edin');
    console.log('4. Firewall ayarlarını kontrol edin');
    console.log('5. MySQL kullanıcısının gerekli yetkilere sahip olduğunu kontrol edin');
  }
};

// Run test
testDatabaseConnection();
