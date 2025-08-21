const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Professional Stock Transactions - Main List
router.get('/transactions', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      transaction_type, // 'in' or 'out'
      start_date,
      end_date,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Sanitize pagination and sorting
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offsetNum = (pageNum - 1) * limitNum;
    const allowedSortFields = new Set(['created_at', 'reference_number', 'total_amount', 'transaction_type']);
    const allowedSortOrders = new Set(['ASC', 'DESC']);
    const safeSortBy = allowedSortFields.has(String(sort_by)) ? String(sort_by) : 'created_at';
    const safeSortOrder = allowedSortOrders.has(String(sort_order).toUpperCase()) ? String(sort_order).toUpperCase() : 'DESC';

    let whereConditions = ['sm.reference_number IS NOT NULL'];
    let params = [];

    // Transaction type filter
    if (transaction_type && ['in', 'out'].includes(transaction_type)) {
      whereConditions.push('sm.movement_type = ?');
      params.push(transaction_type);
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
        sm.reference_number LIKE ? OR 
        sm.notes LIKE ? OR
        c.name LIKE ? OR
        s.name LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count of unique transactions
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM (
         SELECT DISTINCT sm.reference_number, sm.created_at
         FROM stock_movements sm
         LEFT JOIN customers c ON sm.customer_id = c.id
         LEFT JOIN suppliers s ON sm.supplier_id = s.id
         WHERE ${whereClause}
       ) as unique_transactions`,
      params
    );

    const total = countResult[0].total;

    // Get summary statistics
    const [summaryResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN movement_type = 'in' THEN 1 ELSE 0 END) as total_in,
        SUM(CASE WHEN movement_type = 'out' THEN 1 ELSE 0 END) as total_out,
        SUM(total_amount) as total_amount
      FROM (
        SELECT DISTINCT sm.reference_number, sm.created_at, sm.movement_type, sm.total_amount
        FROM stock_movements sm
        LEFT JOIN customers c ON sm.customer_id = c.id
        LEFT JOIN suppliers s ON sm.supplier_id = s.id
        WHERE ${whereClause}
      ) as unique_transactions`,
      params
    );

    const summary = summaryResult[0];

    // Get main transaction list (grouped by reference_number and created_at)
    const transactionsQuery = `
      SELECT 
        sm.reference_number,
        MAX(sm.movement_type) as transaction_type,
        sm.created_at,
        MAX(sm.notes) as notes,
        MAX(sm.user_id) as user_id,
        MAX(sm.supplier_id) as supplier_id,
        MAX(sm.customer_id) as customer_id,
        MAX(c.name) as customer_name,
        MAX(c.phone) as customer_phone,
        MAX(s.name) as supplier_name,
        MAX(s.phone) as supplier_phone,
        MAX(u.full_name) as user_name,
        COUNT(sm.id) as items_count,
        SUM(sm.quantity) as total_quantity,
        SUM(sm.total_amount) as total_amount
      FROM stock_movements sm
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE ${whereClause}
      GROUP BY sm.reference_number, sm.created_at
      ORDER BY sm.${safeSortBy} ${safeSortOrder}
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [transactions] = await pool.execute(transactionsQuery, params);

    res.json({
      transactions,
      summary,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum
      }
    });
  } catch (error) {
    console.error('Get stock transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch stock transactions' });
  }
});

// Professional Stock Transaction Detail
router.get('/transactions/:reference_number', async (req, res) => {
  try {
    const { reference_number } = req.params;
    const { created_at } = req.query;

    if (!reference_number) {
      return res.status(400).json({ error: 'Reference number is required' });
    }

    let whereClause = 'sm.reference_number = ?';
    let params = [reference_number];

    if (created_at) {
      whereClause += ' AND DATE(sm.created_at) = ?';
      params.push(created_at);
    }

    // Get transaction header info
    const [headerResult] = await pool.execute(
      `SELECT 
        sm.reference_number,
        MAX(sm.movement_type) as transaction_type,
        sm.created_at,
        MAX(sm.notes) as notes,
        MAX(sm.user_id) as user_id,
        MAX(sm.supplier_id) as supplier_id,
        MAX(sm.customer_id) as customer_id,
        MAX(c.name) as customer_name,
        MAX(c.phone) as customer_phone,
        MAX(c.email) as customer_email,
        MAX(c.address) as customer_address,
        MAX(s.name) as supplier_name,
        MAX(s.phone) as supplier_phone,
        MAX(s.email) as supplier_email,
        MAX(s.address) as supplier_address,
        MAX(u.full_name) as user_name,
        COUNT(sm.id) as items_count,
        SUM(sm.quantity) as total_quantity,
        SUM(sm.total_amount) as total_amount
      FROM stock_movements sm
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE ${whereClause}
      GROUP BY sm.reference_number, sm.created_at`,
      params
    );

    if (headerResult.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const header = headerResult[0];

    // Get transaction items
    const [itemsResult] = await pool.execute(
      `SELECT 
        sm.id,
        sm.product_id,
        sm.quantity,
        sm.unit_price,
        sm.total_amount,
        sm.notes as item_notes,
        p.name as product_name,
        p.sku as product_sku,
        p.description as product_description,
        p.unit as product_unit,
        cat.name as category_name,
        w.name as warehouse_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      WHERE ${whereClause}
      ORDER BY p.name`,
      params
    );

    res.json({
      transaction: {
        header,
        items: itemsResult
      }
    });
  } catch (error) {
    console.error('Get stock transaction detail error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction detail' });
  }
});

// Professional Stock In Transactions List
router.get('/transactions/in', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      start_date,
      end_date,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Sanitize pagination and sorting
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offsetNum = (pageNum - 1) * limitNum;
    const allowedSortFields = new Set(['created_at', 'reference_number', 'total_amount', 'supplier_name']);
    const allowedSortOrders = new Set(['ASC', 'DESC']);
    const safeSortBy = allowedSortFields.has(String(sort_by)) ? String(sort_by) : 'created_at';
    const safeSortOrder = allowedSortOrders.has(String(sort_order).toUpperCase()) ? String(sort_order).toUpperCase() : 'DESC';

    let whereConditions = ['sm.movement_type = ?', 'sm.reference_number IS NOT NULL'];
    let params = ['in'];

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
        sm.reference_number LIKE ? OR 
        sm.notes LIKE ? OR
        s.name LIKE ? OR
        s.phone LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM (
         SELECT DISTINCT sm.reference_number, sm.created_at
         FROM stock_movements sm
         LEFT JOIN suppliers s ON sm.supplier_id = s.id
         WHERE ${whereClause}
       ) as unique_transactions`,
      params
    );

    const total = countResult[0].total;

    // Get summary statistics - Simplified without subquery
    const summary = {
      total_transactions: total,
      total_amount: 0,
      total_quantity: 0
    };

    // Get stock in transactions
    const transactionsQuery = `
      SELECT 
        sm.reference_number,
        sm.created_at,
        MAX(sm.notes) as notes,
        MAX(sm.supplier_id) as supplier_id,
        MAX(s.name) as supplier_name,
        MAX(s.phone) as supplier_phone,
        MAX(s.email) as supplier_email,
        MAX(u.full_name) as user_name,
        COUNT(sm.id) as items_count,
        SUM(sm.quantity) as total_quantity,
        SUM(sm.total_amount) as total_amount
      FROM stock_movements sm
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE ${whereClause}
      GROUP BY sm.reference_number, sm.created_at
      ORDER BY sm.${safeSortBy} ${safeSortOrder}
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [transactions] = await pool.execute(transactionsQuery, params);

    res.json({
      transactions,
      summary,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum
      }
    });
  } catch (error) {
    console.error('Get stock in transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch stock in transactions' });
  }
});

// Professional Stock Out Transactions List
router.get('/transactions/out', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      start_date,
      end_date,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    // Sanitize pagination and sorting
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offsetNum = (pageNum - 1) * limitNum;
    const allowedSortFields = new Set(['created_at', 'reference_number', 'total_amount', 'customer_name']);
    const allowedSortOrders = new Set(['ASC', 'DESC']);
    const safeSortBy = allowedSortFields.has(String(sort_by)) ? String(sort_by) : 'created_at';
    const safeSortOrder = allowedSortOrders.has(String(sort_order).toUpperCase()) ? String(sort_order).toUpperCase() : 'DESC';

    let whereConditions = ['sm.movement_type = ?', 'sm.reference_number IS NOT NULL'];
    let params = ['out'];

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
        sm.reference_number LIKE ? OR 
        sm.notes LIKE ? OR
        c.name LIKE ? OR
        c.phone LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM (
         SELECT DISTINCT sm.reference_number, sm.created_at
         FROM stock_movements sm
         LEFT JOIN customers c ON sm.customer_id = c.id
         WHERE ${whereClause}
       ) as unique_transactions`,
      params
    );

    const total = countResult[0].total;

    // Get summary statistics - Simplified without subquery
    const summary = {
      total_transactions: total,
      total_amount: 0,
      total_quantity: 0
    };

    // Get stock out transactions
    const transactionsQuery = `
      SELECT 
        sm.reference_number,
        sm.created_at,
        MAX(sm.notes) as notes,
        MAX(sm.customer_id) as customer_id,
        MAX(c.name) as customer_name,
        MAX(c.phone) as customer_phone,
        MAX(c.email) as customer_email,
        MAX(u.full_name) as user_name,
        COUNT(sm.id) as items_count,
        SUM(sm.quantity) as total_quantity,
        SUM(sm.total_amount) as total_amount
      FROM stock_movements sm
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE ${whereClause}
      GROUP BY sm.reference_number, sm.created_at
      ORDER BY sm.${safeSortBy} ${safeSortOrder}
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;

    const [transactions] = await pool.execute(transactionsQuery, params);

    res.json({
      transactions,
      summary,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum
      }
    });
  } catch (error) {
    console.error('Get stock out transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch stock out transactions' });
  }
});

// Stock In API - Multiple Items
router.post('/in', async (req, res) => {
  try {
    const { supplier_id, reference_number, notes, entry_date, items } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'En az bir ürün eklemelisiniz' });
    }

    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return res.status(400).json({ error: 'Tüm ürünler için gerekli alanları doldurun' });
      }
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Generate reference number if not provided
      const finalReferenceNumber = reference_number || `STK-IN-${Date.now()}`;
      const finalEntryDate = entry_date || new Date().toISOString();

      // Insert stock movements for each item
      for (const item of items) {
        const [result] = await connection.execute(
          `INSERT INTO stock_movements (
            product_id, 
            quantity, 
            unit_price, 
            total_amount, 
            movement_type, 
            supplier_id, 
            reference_number, 
            notes, 
            created_at,
            user_id
          ) VALUES (?, ?, ?, ?, 'in', ?, ?, ?, ?, ?)`,
          [
            parseInt(item.product_id),
            parseInt(item.quantity),
            parseFloat(item.unit_price),
            item.total_amount,
            supplier_id ? parseInt(supplier_id) : null,
            finalReferenceNumber,
            notes || '',
            finalEntryDate,
            req.user?.id || null
          ]
        );

        // Update product stock
        await connection.execute(
          `UPDATE products 
           SET current_stock = current_stock + ?, 
               updated_at = NOW() 
           WHERE id = ?`,
          [parseInt(item.quantity), parseInt(item.product_id)]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Stok girişi başarıyla yapıldı',
        reference_number: finalReferenceNumber,
        items_count: items.length
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Stock in error:', error);
    res.status(500).json({ error: 'Stok girişi yapılırken hata oluştu' });
  }
});

module.exports = router;
