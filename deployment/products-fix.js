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

module.exports = router;


