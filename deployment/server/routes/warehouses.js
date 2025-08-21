const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Get all warehouses
router.get('/', async (req, res) => {
  try {
    const [warehouses] = await pool.execute(
      'SELECT * FROM warehouses WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json({ warehouses });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// Get single warehouse
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid warehouse ID' });
    }
    const [warehouses] = await pool.execute(
      'SELECT * FROM warehouses WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (warehouses.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ warehouse: warehouses[0] });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse' });
  }
});

// Create warehouse
router.post('/', [
  body('name').notEmpty().withMessage('Warehouse name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, location, description } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO warehouses (name, location, description) VALUES (?, ?, ?)',
      [name, location, description]
    );

    const [newWarehouse] = await pool.execute(
      'SELECT * FROM warehouses WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Warehouse created successfully',
      warehouse: newWarehouse[0]
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

// Update warehouse
router.put('/:id', [
  // Validate id parameter first
  (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid warehouse ID' });
    }
    next();
  },
  body('name').notEmpty().withMessage('Warehouse name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, location, description } = req.body;

    const [result] = await pool.execute(
      'UPDATE warehouses SET name = ?, location = ?, description = ? WHERE id = ? AND is_active = TRUE',
      [name, location, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    const [updatedWarehouse] = await pool.execute(
      'SELECT * FROM warehouses WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Warehouse updated successfully',
      warehouse: updatedWarehouse[0]
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Failed to update warehouse' });
  }
});

// Delete warehouse
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid warehouse ID' });
    }

    // Check if warehouse has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE warehouse_id = ? AND is_active = TRUE',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete warehouse that has products. Please move products to another warehouse first.' 
      });
    }

    const [result] = await pool.execute(
      'UPDATE warehouses SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Failed to delete warehouse' });
  }
});

module.exports = router; 