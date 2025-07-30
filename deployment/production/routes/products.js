const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { checkPermission } = require('../middleware/auth');

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

    const offset = (page - 1) * limit;
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
      [...params, parseInt(limit), offset]
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
router.post('/', checkPermission('products:create'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('min_stock').isInt({ min: 0 }).withMessage('Min stock must be a positive integer'),
  body('initial_stock').isInt({ min: 0 }).withMessage('Initial stock must be a positive integer'),
  body('category_id').notEmpty().withMessage('Category is required'),
  body('supplier_id').notEmpty().withMessage('Supplier is required'),
  body('warehouse_id').optional().isString(),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
       price, price, min_stock, initial_stock * 2, unit, initial_stock]
    );

    // Get the created product
    const [newProduct] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/:id', checkPermission('products:update'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('min_stock').isInt({ min: 0 }).withMessage('Min stock must be a positive integer'),
  body('initial_stock').isInt({ min: 0 }).withMessage('Initial stock must be a positive integer'),
  body('category_id').notEmpty().withMessage('Category is required'),
  body('supplier_id').notEmpty().withMessage('Supplier is required'),
  body('warehouse_id').optional().isString(),
  body('unit').notEmpty().withMessage('Unit is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
      initial_stock,
      unit
    } = req.body;

    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update product
    await pool.execute(
      `UPDATE products SET 
        name = ?, sku = ?, description = ?, category_id = ?,
        supplier_id = ?, warehouse_id = ?, unit_price = ?, cost_price = ?,
        min_stock_level = ?, max_stock_level = ?, unit = ?
      WHERE id = ?`,
      [name, sku, description, category_id, supplier_id, warehouse_id,
       price, price, min_stock, initial_stock * 2, unit, id]
    );

    // Get updated product
    const [updatedProduct] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (soft delete)
router.delete('/:id', checkPermission('products:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [existingProducts] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingProducts.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Soft delete
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
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const [products] = await pool.execute(
      `SELECT 
        p.*,
        c.name as category_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.current_stock <= p.min_stock_level AND p.is_active = TRUE
      ORDER BY (p.min_stock_level - p.current_stock) DESC`
    );

    res.json({ low_stock_products: products });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get out of stock products
router.get('/alerts/out-of-stock', async (req, res) => {
  try {
    const [products] = await pool.execute(
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

    res.json({ out_of_stock_products: products });
  } catch (error) {
    console.error('Get out of stock products error:', error);
    res.status(500).json({ error: 'Failed to fetch out of stock products' });
  }
});

module.exports = router; 