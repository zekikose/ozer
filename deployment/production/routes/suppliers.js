const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const [suppliers] = await pool.execute(
      'SELECT * FROM suppliers WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json({ suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [suppliers] = await pool.execute(
      'SELECT * FROM suppliers WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (suppliers.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ supplier: suppliers[0] });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create supplier
router.post('/', [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, contact_person, email, phone, address } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person, email, phone, address]
    );

    const [newSupplier] = await pool.execute(
      'SELECT * FROM suppliers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier: newSupplier[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', [
  body('name').notEmpty().withMessage('Supplier name is required'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, contact_person, email, phone, address } = req.body;

    const [result] = await pool.execute(
      'UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ? AND is_active = TRUE',
      [name, contact_person, email, phone, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const [updatedSupplier] = await pool.execute(
      'SELECT * FROM suppliers WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier[0]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE supplier_id = ? AND is_active = TRUE',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier with existing products' 
      });
    }

    const [result] = await pool.execute(
      'UPDATE suppliers SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

module.exports = router; 