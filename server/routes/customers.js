const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Get all customers
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer: customers[0] });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', [
  body('name').notEmpty().withMessage('Customer name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, address } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone, address]
    );

    const [newCustomer] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer[0]
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', [
  body('name').notEmpty().withMessage('Customer name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const [result] = await pool.execute(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ? AND is_active = TRUE',
      [name, email, phone, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [updatedCustomer] = await pool.execute(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer[0]
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has stock movements
    const [movements] = await pool.execute(
      'SELECT COUNT(*) as count FROM stock_movements WHERE customer_id = ?',
      [id]
    );

    if (movements[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer that has stock movements. Please delete movements first.' 
      });
    }

    const [result] = await pool.execute(
      'UPDATE customers SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router; 