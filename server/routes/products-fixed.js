const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Get all products with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category_id, 
      supplier_id,
      warehouse_id,
      low_stock = false
    } = req.query;

    // Parse and validate parameters
    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const offset = (parsedPage - 1) * parsedLimit;
    
    let whereConditions = ['p.is_active = TRUE'];
    let params = [];

    // Search filter
    if (search && search.trim()) {
      whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Category filter
    if (category_id && category_id.trim()) {
      whereConditions.push('p.category_id = ?');
      params.push(category_id.trim());
    }

    // Supplier filter
    if (supplier_id && supplier_id.trim()) {
      whereConditions.push('p.supplier_id = ?');
      params.push(supplier_id.trim());
    }

    // Warehouse filter
    if (warehouse_id && warehouse_id.trim()) {
      whereConditions.push('p.warehouse_id = ?');
      params.push(warehouse_id.trim());
    }

    // Low stock filter
    if (low_stock === 'true') {
      whereConditions.push('p.current_stock <= p.min_stock_level');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get products with category, supplier and warehouse info
    const [products] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name,
        w.name as warehouse_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE ${whereClause}
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?`,
      [...params, parsedLimit, offset]
    );

    res.json({
      products,
      pagination: {
        current_page: parsedPage,
        total_pages: Math.ceil(total / parsedLimit),
        total_items: total,
        items_per_page: parsedLimit
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product: products[0] });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      category_id,
      supplier_id,
      warehouse_id,
      price,
      min_stock,
      initial_stock,
      unit
    } = req.body;

    // Check if SKU already exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE sku = ?',
      [sku]
    );

    if (existingProducts.length > 0) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    // Insert new product
    const [result] = await pool.execute(
      `INSERT INTO products (
        name, sku, description, category_id, supplier_id, warehouse_id,
        unit_price, cost_price, min_stock_level, max_stock_level,
        unit, current_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, description, category_id, supplier_id, warehouse_id,
       price, price, min_stock, parseInt(min_stock) * 2, unit, initial_stock]
    );

    const productId = result.insertId;

    // Get the created product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: products[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      sku,
      description,
      category_id,
      supplier_id,
      warehouse_id,
      price,
      min_stock,
      unit
    } = req.body;

    // Check if SKU already exists for other products
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE sku = ? AND id != ?',
      [sku, id]
    );

    if (existingProducts.length > 0) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    // Update product
    await pool.execute(
      `UPDATE products SET 
        name = ?, sku = ?, description = ?, category_id = ?, 
        supplier_id = ?, warehouse_id = ?, unit_price = ?, 
        cost_price = ?, min_stock_level = ?, unit = ?, updated_at = NOW()
      WHERE id = ?`,
      [name, sku, description, category_id, supplier_id, warehouse_id,
       price, price, min_stock, unit, id]
    );

    // Get the updated product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Product updated successfully',
      product: products[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE products SET is_active = FALSE WHERE id = ?',
      [id]
    );

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get low stock products
router.get('/low-stock/list', async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name,
        w.name as warehouse_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.is_active = TRUE AND p.current_stock <= p.min_stock_level
      ORDER BY (p.min_stock_level - p.current_stock) DESC`
    );

    res.json({ products });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get product statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [totalProducts] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE'
    );

    const [lowStockProducts] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE AND current_stock <= min_stock_level'
    );

    const [outOfStockProducts] = await pool.execute(
      'SELECT COUNT(*) as total FROM products WHERE is_active = TRUE AND current_stock = 0'
    );

    const [totalValue] = await pool.execute(
      'SELECT SUM(current_stock * unit_price) as total FROM products WHERE is_active = TRUE'
    );

    res.json({
      total_products: totalProducts[0].total,
      low_stock_products: lowStockProducts[0].total,
      out_of_stock_products: outOfStockProducts[0].total,
      total_value: totalValue[0].total || 0
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({ error: 'Failed to fetch product statistics' });
  }
});

module.exports = router;
