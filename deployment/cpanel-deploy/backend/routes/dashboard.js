const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    // Total products
    const [totalProducts] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE'
    );

    // Low stock products
    const [lowStockProducts] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE current_stock <= min_stock_level AND is_active = TRUE'
    );

    // Out of stock products
    const [outOfStockProducts] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE current_stock = 0 AND is_active = TRUE'
    );

    // Total stock value
    const [stockValue] = await pool.execute(
      'SELECT SUM(current_stock * unit_price) as total_value FROM products WHERE is_active = TRUE'
    );

    // Total categories
    const [totalCategories] = await pool.execute(
      'SELECT COUNT(*) as total FROM categories WHERE is_active = TRUE'
    );

    // Total suppliers
    const [totalSuppliers] = await pool.execute(
      'SELECT COUNT(*) as total FROM suppliers WHERE is_active = TRUE'
    );

    // Recent stock movements
    const [recentMovements] = await pool.execute(
      `SELECT 
        sm.*,
        p.name as product_name,
        p.sku,
        u.full_name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      ORDER BY sm.created_at DESC
      LIMIT 10`
    );

    // Stock movements by type (last 30 days)
    const [movementsByType] = await pool.execute(
      `SELECT 
        movement_type,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY movement_type`
    );

    res.json({
      overview: {
        total_products: totalProducts[0].total,
        low_stock_products: lowStockProducts[0].total,
        out_of_stock_products: outOfStockProducts[0].total,
        total_stock_value: stockValue[0].total_value || 0,
        total_categories: totalCategories[0].total,
        total_suppliers: totalSuppliers[0].total
      },
      recent_movements: recentMovements,
      movements_by_type: movementsByType
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get stock alerts
router.get('/alerts', async (req, res) => {
  try {
    // Low stock products
    const [lowStockProducts] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name,
        (p.min_stock_level - p.current_stock) as shortage
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock <= p.min_stock_level AND p.is_active = TRUE
      ORDER BY shortage DESC`
    );

    // Out of stock products
    const [outOfStockProducts] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock = 0 AND p.is_active = TRUE
      ORDER BY p.name ASC`
    );

    // Overstock products (above max level)
    const [overstockProducts] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name,
        (p.current_stock - p.max_stock_level) as excess
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock > p.max_stock_level AND p.is_active = TRUE
      ORDER BY excess DESC`
    );

    res.json({
      low_stock: lowStockProducts,
      out_of_stock: outOfStockProducts,
      overstock: overstockProducts
    });
  } catch (error) {
    console.error('Stock alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch stock alerts' });
  }
});

// Get stock movements chart data
router.get('/charts/stock-movements', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Stock movements by date
    const [movementsByDate] = await pool.execute(
      `SELECT 
        DATE(created_at) as date,
        movement_type,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at), movement_type
      ORDER BY date ASC`,
      [period]
    );

    // Stock movements by product (top 10)
    const [movementsByProduct] = await pool.execute(
      `SELECT 
        p.name as product_name,
        p.sku,
        COUNT(sm.id) as movement_count,
        SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity ELSE 0 END) as total_in,
        SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity ELSE 0 END) as total_out
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY p.id, p.name, p.sku
      ORDER BY movement_count DESC
      LIMIT 10`,
      [period]
    );

    res.json({
      movements_by_date: movementsByDate,
      movements_by_product: movementsByProduct
    });
  } catch (error) {
    console.error('Stock movements chart error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements chart data' });
  }
});

// Get inventory value chart data
router.get('/charts/inventory-value', async (req, res) => {
  try {
    // Inventory value by category
    const [valueByCategory] = await pool.execute(
      `SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        SUM(p.current_stock * p.unit_price) as total_value,
        AVG(p.unit_price) as avg_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      GROUP BY c.id, c.name
      ORDER BY total_value DESC`
    );

    // Top value products
    const [topValueProducts] = await pool.execute(
      `SELECT 
        name,
        sku,
        current_stock,
        unit_price,
        (current_stock * unit_price) as total_value
      FROM products
      WHERE is_active = TRUE
      ORDER BY (current_stock * unit_price) DESC
      LIMIT 10`
    );

    // Stock value trend (last 30 days)
    const [valueTrend] = await pool.execute(
      `SELECT 
        DATE(sm.created_at) as date,
        SUM(CASE WHEN sm.movement_type = 'in' THEN sm.quantity * sm.unit_price ELSE 0 END) as value_in,
        SUM(CASE WHEN sm.movement_type = 'out' THEN sm.quantity * sm.unit_price ELSE 0 END) as value_out
      FROM stock_movements sm
      WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(sm.created_at)
      ORDER BY date ASC`
    );

    res.json({
      value_by_category: valueByCategory,
      top_value_products: topValueProducts,
      value_trend: valueTrend
    });
  } catch (error) {
    console.error('Inventory value chart error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory value chart data' });
  }
});

// Get supplier performance
router.get('/supplier-performance', async (req, res) => {
  try {
    const [supplierStats] = await pool.execute(
      `SELECT 
        s.name as supplier_name,
        s.email,
        s.phone,
        COUNT(p.id) as product_count,
        SUM(p.current_stock * p.unit_price) as total_value,
        AVG(p.unit_price) as avg_price
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = TRUE
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name, s.email, s.phone
      ORDER BY total_value DESC`
    );

    res.json({ supplier_performance: supplierStats });
  } catch (error) {
    console.error('Supplier performance error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier performance' });
  }
});

// Get recent activities
router.get('/recent-activities', async (req, res) => {
  try {
    const [activities] = await pool.execute(
      `SELECT 
        'stock_movement' as type,
        sm.created_at,
        CONCAT(sm.movement_type, ' - ', p.name, ' (', sm.quantity, ')') as description,
        u.full_name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'product_created' as type,
        p.created_at,
        CONCAT('New product: ', p.name) as description,
        NULL as user_name
      FROM products p
      WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      ORDER BY created_at DESC
      LIMIT 20`
    );

    res.json({ recent_activities: activities });
  } catch (error) {
    console.error('Recent activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

module.exports = router; 