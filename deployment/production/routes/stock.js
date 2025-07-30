const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get stock movements with pagination
router.get('/movements', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      product_id, 
      movement_type,
      start_date,
      end_date,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['1=1'];
    let params = [];

    // Product filter
    if (product_id) {
      whereConditions.push('sm.product_id = ?');
      params.push(product_id);
    }

    // Movement type filter
    if (movement_type) {
      whereConditions.push('sm.movement_type = ?');
      params.push(movement_type);
    }

    // Date range filter
    if (start_date) {
      whereConditions.push('DATE(sm.created_at) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push('DATE(sm.created_at) <= ?');
      params.push(end_date);
    }

    // Search filter
    if (search) {
      whereConditions.push(`(
        p.name LIKE ? OR 
        p.sku LIKE ? OR 
        sm.reference_number LIKE ? OR 
        sm.notes LIKE ? OR
        c.name LIKE ? OR
        s.name LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN customers c ON sm.customer_id = c.id
       LEFT JOIN suppliers s ON sm.supplier_id = s.id
       WHERE ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get summary statistics
    const [summaryResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total_movements,
        SUM(CASE WHEN sm.movement_type = 'in' THEN 1 ELSE 0 END) as total_in,
        SUM(CASE WHEN sm.movement_type = 'out' THEN 1 ELSE 0 END) as total_out,
        SUM(CASE WHEN sm.movement_type = 'adjustment' THEN 1 ELSE 0 END) as total_adjustment
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE ${whereClause}`,
      params
    );

    const summary = summaryResult[0];

    // Get movements with product, user, customer and supplier info
    const [movements] = await pool.execute(
      `SELECT 
        sm.*,
        p.name as product_name,
        p.sku,
        u.full_name as user_name,
        c.name as customer_name,
        s.name as supplier_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE ${whereClause}
      ORDER BY sm.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      movements,
      summary,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// Add stock movement (stock in)
router.post('/in', checkPermission('stock:in'), [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('supplier_id').isInt().withMessage('Tedarikçi seçimi zorunludur'),
  body('reference_number').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity, unit_price, supplier_id, reference_number, notes } = req.body;
    const total_amount = quantity * unit_price;

    // Get connection for transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO stock_movements (
          product_id, movement_type, quantity, unit_price, 
          total_amount, reference_number, notes, user_id, supplier_id
        ) VALUES (?, 'in', ?, ?, ?, ?, ?, ?, ?)`,
        [product_id, quantity, unit_price, total_amount, reference_number, notes, req.user?.id, supplier_id]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [quantity, product_id]
      );

      await connection.commit();

      // Get the created movement
      const [movements] = await pool.execute(
        `SELECT 
          sm.*,
          p.name as product_name,
          p.sku,
          u.full_name as user_name,
          s.name as supplier_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        LEFT JOIN suppliers s ON sm.supplier_id = s.id
        WHERE sm.id = ?`,
        [movementResult.insertId]
      );

      res.status(201).json({
        message: 'Stock added successfully',
        movement: movements[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ error: 'Failed to add stock' });
  }
});

// Remove stock movement (stock out)
router.post('/out', checkPermission('stock:out'), [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('customer_id').isInt().withMessage('Customer ID is required'),
  body('reference_number').optional().isString(),
  body('notes').optional().isString(),
  body('movement_date').optional().isDate().withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      product_id, 
      quantity, 
      unit_price, 
      customer_id,
      reference_number, 
      notes,
      movement_date 
    } = req.body;
    const total_amount = quantity * unit_price;

    // Check current stock
    const [products] = await pool.execute(
      'SELECT current_stock FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (products[0].current_stock < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        current_stock: products[0].current_stock,
        requested_quantity: quantity
      });
    }

    // Get connection for transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO stock_movements (
          product_id, movement_type, quantity, unit_price, 
          total_amount, reference_number, notes, user_id, customer_id, movement_date
        ) VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product_id, quantity, unit_price, total_amount, reference_number || null, notes || null, req.user?.id || null, customer_id, movement_date || new Date()]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
        [quantity, product_id]
      );

      await connection.commit();

      // Get the created movement
      const [movements] = await pool.execute(
        `SELECT 
          sm.*,
          p.name as product_name,
          p.sku,
          u.full_name as user_name,
          c.name as customer_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        LEFT JOIN customers c ON sm.customer_id = c.id
        WHERE sm.id = ?`,
        [movementResult.insertId]
      );

      res.status(201).json({
        message: 'Stock removed successfully',
        movement: movements[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Remove stock error:', error);
    res.status(500).json({ error: 'Failed to remove stock' });
  }
});

// Stock adjustment
router.post('/adjustment', checkPermission('stock:adjustment'), [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('new_quantity').isInt({ min: 0 }).withMessage('New quantity must be a non-negative integer'),
  body('notes').notEmpty().withMessage('Notes are required for adjustment')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, new_quantity, notes } = req.body;

    // Get current stock
    const [products] = await pool.execute(
      'SELECT current_stock, unit_price FROM products WHERE id = ?',
      [product_id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const current_stock = products[0].current_stock;
    const unit_price = products[0].unit_price;
    const adjustment_quantity = new_quantity - current_stock;

    if (adjustment_quantity === 0) {
      return res.status(400).json({ error: 'No adjustment needed' });
    }

    // Get connection for transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO stock_movements (
          product_id, movement_type, quantity, unit_price, 
          total_amount, notes, user_id
        ) VALUES (?, 'adjustment', ?, ?, ?, ?, ?)`,
        [product_id, Math.abs(adjustment_quantity), unit_price, 
         Math.abs(adjustment_quantity) * unit_price, notes, req.user?.id || null]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = ? WHERE id = ?',
        [new_quantity, product_id]
      );

      await connection.commit();

      // Get the created movement
      const [movements] = await pool.execute(
        `SELECT 
          sm.*,
          p.name as product_name,
          p.sku,
          u.full_name as user_name
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        LEFT JOIN users u ON sm.user_id = u.id
        WHERE sm.id = ?`,
        [movementResult.insertId]
      );

      res.status(201).json({
        message: 'Stock adjusted successfully',
        movement: movements[0],
        adjustment: {
          previous_stock: current_stock,
          new_stock: new_quantity,
          adjustment_quantity: adjustment_quantity
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Get stock movement by ID
router.get('/movements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [movements] = await pool.execute(
      `SELECT 
        sm.*,
        p.name as product_name,
        p.sku,
        u.full_name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.id = ?`,
      [id]
    );

    if (movements.length === 0) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    res.json({ movement: movements[0] });
  } catch (error) {
    console.error('Get stock movement error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movement' });
  }
});

module.exports = router; 