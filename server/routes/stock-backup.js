const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

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

    // Sanitize pagination and sorting
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const offsetNum = (pageNum - 1) * limitNum;
    const allowedSortFields = new Set([
      'created_at', 'quantity', 'unit_price', 'total_amount', 'movement_type',
      'product_id', 'reference_number', 'exit_date', 'entry_date'
    ]);
    const allowedSortOrders = new Set(['ASC', 'DESC']);
    const safeSortBy = allowedSortFields.has(String(sort_by)) ? String(sort_by) : 'created_at';
    const safeSortOrder = allowedSortOrders.has(String(sort_order).toUpperCase()) ? String(sort_order).toUpperCase() : 'DESC';
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
    const movementsQuery = `
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku as product_sku,
        u.full_name as user_name,
        c.name as customer_name,
        s.name as supplier_name,
        CASE 
          WHEN sm.movement_type = 'out' AND sm.reference_number IS NOT NULL THEN 
            (SELECT COUNT(*) FROM stock_movements sm2 
             WHERE sm2.reference_number = sm.reference_number 
             AND sm2.exit_date = sm.exit_date 
             AND sm2.movement_type = 'out')
          ELSE 1
        END as items_count
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN customers c ON sm.customer_id = c.id
      LEFT JOIN suppliers s ON sm.supplier_id = s.id
      WHERE ${whereClause}
      ORDER BY sm.${safeSortBy} ${safeSortOrder}
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    const [movements] = await pool.execute(movementsQuery, params);

    // Group multiple out movements with same reference_number and exit_date
    const groupedMovements = [];
    const processedGroups = new Set();

    for (const movement of movements) {
      if (movement.movement_type === 'out' && movement.reference_number && movement.items_count > 1) {
        const groupKey = `${movement.reference_number}-${movement.exit_date}`;
        
        if (!processedGroups.has(groupKey)) {
          // Find all movements in this group
          const groupMovements = movements.filter(m => 
            m.movement_type === 'out' && 
            m.reference_number === movement.reference_number && 
            m.exit_date === movement.exit_date
          );
          
          // Create a grouped movement entry
          const groupedMovement = {
            ...movement,
            is_grouped: true,
            group_items: groupMovements,
            total_quantity: groupMovements.reduce((sum, m) => sum + parseInt(m.quantity), 0),
            total_amount: groupMovements.reduce((sum, m) => sum + parseFloat(m.total_amount), 0),
            products_count: groupMovements.length
          };
          
          groupedMovements.push(groupedMovement);
          processedGroups.add(groupKey);
        }
      } else if (movement.movement_type !== 'out' || !movement.reference_number || movement.items_count <= 1) {
        // Add non-grouped movements as is
        groupedMovements.push({
          ...movement,
          is_grouped: false
        });
      }
    }

    res.json({
      movements: groupedMovements,
      summary,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil(total / limitNum),
        total_items: total,
        items_per_page: limitNum
      }
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Failed to fetch stock movements' });
  }
});

// Add stock movement (stock in)
router.post('/in', [
  body('product_id').isInt().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
  body('supplier_id').optional().isInt().withMessage('Supplier ID must be an integer'),
  body('reference_number').optional().isString(),
  body('notes').optional().isString(),
  body('entry_date').isISO8601().withMessage('Entry date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity, unit_price, supplier_id, reference_number, notes, entry_date } = req.body;
    const total_amount = quantity * unit_price;

    // Get connection for transaction
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO stock_movements (
          product_id, movement_type, quantity, unit_price, 
          total_amount, reference_number, notes, user_id, supplier_id, entry_date
        ) VALUES (?, 'in', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [product_id, quantity, unit_price, total_amount, reference_number || null, notes || null, null, supplier_id || null, entry_date]
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
router.post('/out', [
  body('customer_id').isInt().withMessage('Customer ID is required'),
  body('reference_number').optional().isString(),
  body('notes').optional().isString(),
  body('exit_date').isISO8601().withMessage('Exit date must be a valid date'),
  body('is_loan').optional().isBoolean().withMessage('Is loan must be a boolean'),
  body('items').isArray().withMessage('Items must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_id,
      reference_number, 
      notes,
      exit_date,
      is_loan = false,
      items
    } = req.body;

    // Check current stock for all items
    const productIds = items.map(item => parseInt(item.product_id) || item.product_id);
    console.log('Requested product IDs:', productIds);
    console.log('Items received:', items);
    
    // Filter out invalid product IDs
    const validProductIds = productIds.filter(id => id && !isNaN(id));
    console.log('Valid product IDs:', validProductIds);
    
    if (validProductIds.length === 0) {
      return res.status(400).json({ 
        error: 'No valid product IDs provided',
        received_ids: productIds
      });
    }
    
    // Handle single item case for MySQL IN clause
    let products;
    if (validProductIds.length === 1) {
      console.log('Single product query:', validProductIds[0]);
      [products] = await pool.execute(
        'SELECT id, current_stock, name FROM products WHERE id = ?',
        [validProductIds[0]]
      );
    } else {
      console.log('Multiple products query:', validProductIds);
      // MySQL'de IN clause için placeholder'ları manuel oluştur
      const placeholders = validProductIds.map(() => '?').join(',');
      const query = `SELECT id, current_stock, name FROM products WHERE id IN (${placeholders})`;
      console.log('Query:', query);
      console.log('Parameters:', validProductIds);
      [products] = await pool.execute(query, validProductIds);
    }

    console.log('Found products:', products);

    if (products.length !== items.length) {
      console.log('Product mismatch:', {
        requested: productIds,
        found: products.map(p => p.id),
        expected: items.length,
        actual: products.length
      });
      return res.status(404).json({ 
        error: 'One or more products not found',
        requested_ids: productIds,
        found_products: products.length,
        expected_products: items.length,
        found_product_ids: products.map(p => p.id)
      });
    }

    // Check stock availability for each item
    for (const item of items) {
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (!product) {
        return res.status(404).json({ 
          error: `Product not found with ID: ${item.product_id}`,
          requested_id: item.product_id,
          available_ids: products.map(p => p.id)
        });
      }
      if (product.current_stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for product: ${product.name}`,
          product_name: product.name,
          current_stock: product.current_stock,
          requested_quantity: item.quantity
        });
      }
    }

    // Get connection for transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const createdMovements = [];

      // Process each item
      for (const item of items) {
        const total_amount = item.quantity * item.unit_price;

      // Insert stock movement
      const [movementResult] = await connection.execute(
        `INSERT INTO stock_movements (
            product_id, movement_type, is_loan, quantity, unit_price, 
            total_amount, reference_number, notes, user_id, customer_id, exit_date
          ) VALUES (?, 'out', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [parseInt(item.product_id), is_loan, parseInt(item.quantity), parseFloat(item.unit_price), total_amount, reference_number || null, notes || null, null, customer_id, exit_date]
        );

        // If it's a loan, insert into loan_items table
        if (is_loan && customer_id) {
          await connection.execute(
            `INSERT INTO loan_items (
              product_id, customer_id, quantity, unit_price, 
              total_amount, reference_number, notes, exit_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [parseInt(item.product_id), customer_id, parseInt(item.quantity), parseFloat(item.unit_price), total_amount, reference_number || null, notes || null, exit_date]
          );
        }

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [parseInt(item.quantity), parseInt(item.product_id)]
      );

        createdMovements.push(movementResult.insertId);
      }

      await connection.commit();

      // Get the created movements
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
        WHERE sm.id IN (?)`,
        [createdMovements]
      );

      res.status(201).json({
        message: is_loan ? 'Emanet işlemi başarıyla kaydedildi' : 'Stok çıkışı başarıyla kaydedildi',
        movements: movements,
        items_processed: items.length,
        loan_created: is_loan
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Remove stock error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Failed to remove stock',
      details: error.message 
    });
  }
});

// Stock adjustment
router.post('/adjustment', [
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
         Math.abs(adjustment_quantity) * unit_price, notes, null]
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
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid movement ID' });
    }

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

// Get loan items
router.get('/loans', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status,
      customer_id,
      product_id,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = ['1=1'];
    let params = [];

    // Status filter
    if (status) {
      whereConditions.push('li.status = ?');
      params.push(status);
    }

    // Customer filter
    if (customer_id) {
      whereConditions.push('li.customer_id = ?');
      params.push(customer_id);
    }

    // Product filter
    if (product_id) {
      whereConditions.push('li.product_id = ?');
      params.push(product_id);
    }

    // Search filter
    if (search) {
      whereConditions.push(`(
        p.name LIKE ? OR 
        p.sku LIKE ? OR 
        li.reference_number LIKE ? OR 
        li.notes LIKE ? OR
        c.name LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM loan_items li
       JOIN products p ON li.product_id = p.id
       JOIN customers c ON li.customer_id = c.id
       WHERE ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get loan items
    const [loans] = await pool.execute(
      `SELECT 
        li.*,
        p.name as product_name,
        p.sku as product_sku,
        c.name as customer_name
      FROM loan_items li
      JOIN products p ON li.product_id = p.id
      JOIN customers c ON li.customer_id = c.id
      WHERE ${whereClause}
      ORDER BY li.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?`,
      [...params, limit.toString(), offset.toString()]
    );

    res.json({
      loans,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get loan items error:', error);
    res.status(500).json({ error: 'Failed to fetch loan items' });
  }
});

// Return loan item
router.post('/loans/:id/return', [
  body('return_date').isISO8601().withMessage('Return date must be a valid date'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { return_date, notes } = req.body;

    // Get connection for transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get loan item
      const [loanItems] = await connection.execute(
        'SELECT * FROM loan_items WHERE id = ? AND status = "active"',
        [id]
      );

      if (loanItems.length === 0) {
        return res.status(404).json({ error: 'Loan item not found or already returned' });
      }

      const loanItem = loanItems[0];

      // Update loan item status
      await connection.execute(
        'UPDATE loan_items SET status = "returned", return_date = ?, notes = CONCAT(IFNULL(notes, ""), " | ", ?) WHERE id = ?',
        [return_date, notes || 'Returned', id]
      );

      // Insert stock movement for return
      await connection.execute(
        `INSERT INTO stock_movements (
          product_id, movement_type, is_loan, quantity, unit_price, 
          total_amount, reference_number, notes, user_id, customer_id, entry_date
        ) VALUES (?, 'in', true, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [loanItem.product_id, loanItem.quantity, loanItem.unit_price, loanItem.total_amount, 
         `RETURN-${loanItem.reference_number || loanItem.id}`, notes || 'Loan return', null, loanItem.customer_id, return_date]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [loanItem.quantity, loanItem.product_id]
      );

      await connection.commit();

      res.json({
        message: 'Loan item returned successfully',
        loan_item_id: id
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Return loan item error:', error);
    res.status(500).json({ error: 'Failed to return loan item' });
  }
});

// Generate loan receipt
router.get('/loans/:id/receipt', async (req, res) => {
  try {
    const { id } = req.params;

    const [loans] = await pool.execute(
      `SELECT 
        li.*,
        p.name as product_name,
        p.sku,
        p.description as product_description,
        p.unit as product_unit,
        p.unit_price as product_unit_price,
        p.cost_price as product_cost_price,
        p.min_stock_level,
        p.current_stock,
        cat.name as category_name,
        w.name as warehouse_name,
        c.name as customer_name,
        c.phone,
        c.email,
        c.address as customer_address
      FROM loan_items li
      JOIN products p ON li.product_id = p.id
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN warehouses w ON p.warehouse_id = w.id
      JOIN customers c ON li.customer_id = c.id
      WHERE li.id = ?`,
      [id]
    );

    if (loans.length === 0) {
      return res.status(404).json({ error: 'Loan item not found' });
    }

    const loan = loans[0];

    // Generate receipt data
    const receipt = {
      id: loan.id,
      date: loan.exit_date,
      customer: {
        name: loan.customer_name,
        phone: loan.phone,
        email: loan.email,
        address: loan.customer_address
      },
      product: {
        name: loan.product_name,
        sku: loan.sku,
        description: loan.product_description,
        unit: loan.product_unit,
        unit_price: loan.product_unit_price,
        cost_price: loan.product_cost_price,
        min_stock_level: loan.min_stock_level,
        current_stock: loan.current_stock,
        category_name: loan.category_name,
        warehouse_name: loan.warehouse_name
      },
      quantity: loan.quantity,
      unit_price: loan.unit_price,
      total_amount: loan.total_amount,
      reference_number: loan.reference_number,
      notes: loan.notes,
      status: loan.status,
      return_date: loan.return_date
    };

    res.json({ receipt });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

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
        SUM(sm.total_amount) as total_amount,
        MIN(sm.id) as first_movement_id
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

    let whereConditions = ['sm.movement_type = "in"'];
    let params = [];

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

    // Get summary statistics
    const [summaryResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_amount,
        SUM(quantity) as total_quantity
      FROM (
        SELECT DISTINCT sm.reference_number, sm.created_at, sm.total_amount, sm.quantity
        FROM stock_movements sm
        LEFT JOIN suppliers s ON sm.supplier_id = s.id
        WHERE ${whereClause}
      ) as unique_transactions`,
      params
    );

    const summary = summaryResult[0];

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

    let whereConditions = ['sm.movement_type = "out"'];
    let params = [];

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

    // Get summary statistics
    const [summaryResult] = await pool.execute(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_amount,
        SUM(quantity) as total_quantity
      FROM (
        SELECT DISTINCT sm.reference_number, sm.created_at, sm.total_amount, sm.quantity
        FROM stock_movements sm
        LEFT JOIN customers c ON sm.customer_id = c.id
        WHERE ${whereClause}
      ) as unique_transactions`,
      params
    );

    const summary = summaryResult[0];

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

module.exports = router; 