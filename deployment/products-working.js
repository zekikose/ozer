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
      low_stock = false,
      sort_by = 'name',
      sort_order = 'ASC'
    } = req.query;

    const offset = parseInt((page - 1) * limit);
    let whereConditions = ['p.is_active = TRUE'];
    let params = [];

    // Search filter
    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Category filter
    if (category_id) {
      whereConditions.push('p.category_id = ?');
      params.push(category_id);
    }

    // Supplier filter
    if (supplier_id) {
      whereConditions.push('p.supplier_id = ?');
      params.push(supplier_id);
    }

    // Warehouse filter
    if (warehouse_id) {
      whereConditions.push('p.warehouse_id = ?');
      params.push(warehouse_id);
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
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      products,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
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
        s.name as supplier_name,
        w.name as warehouse_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('min_stock_level').isInt({ min: 0 }).withMessage('Min stock level must be a positive integer'),
  body('max_stock_level').isInt({ min: 0 }).withMessage('Max stock level must be a positive integer'),
  body('current_stock').isInt({ min: 0 }).withMessage('Current stock must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, sku, barcode, description, category_id, supplier_id, warehouse_id,
      unit, unit_price, cost_price, min_stock_level, max_stock_level, current_stock, image_url
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO products (
        name, sku, barcode, description, category_id, supplier_id, warehouse_id,
        unit, unit_price, cost_price, min_stock_level, max_stock_level, current_stock, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, barcode, description, category_id, supplier_id, warehouse_id,
       unit, unit_price, cost_price, min_stock_level, max_stock_level, current_stock, image_url]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', [
  body('name').notEmpty().withMessage('Name is required'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('cost_price').isFloat({ min: 0 }).withMessage('Cost price must be a positive number'),
  body('min_stock_level').isInt({ min: 0 }).withMessage('Min stock level must be a positive integer'),
  body('max_stock_level').isInt({ min: 0 }).withMessage('Max stock level must be a positive integer'),
  body('current_stock').isInt({ min: 0 }).withMessage('Current stock must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      name, sku, barcode, description, category_id, supplier_id, warehouse_id,
      unit, unit_price, cost_price, min_stock_level, max_stock_level, current_stock, image_url
    } = req.body;

    const [result] = await pool.execute(
      `UPDATE products SET 
        name = ?, sku = ?, barcode = ?, description = ?, category_id = ?, supplier_id = ?, warehouse_id = ?,
        unit = ?, unit_price = ?, cost_price = ?, min_stock_level = ?, max_stock_level = ?, current_stock = ?, image_url = ?
      WHERE id = ?`,
      [name, sku, barcode, description, category_id, supplier_id, warehouse_id,
       unit, unit_price, cost_price, min_stock_level, max_stock_level, current_stock, image_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute(
      'UPDATE products SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;


