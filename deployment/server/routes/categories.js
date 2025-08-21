const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category: categories[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// Create category
router.post('/', [
  body('name').notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );

    const [newCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', [
  // Validate id parameter first
  (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }
    next();
  },
  body('name').notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description } = req.body;

    const [result] = await pool.execute(
      'UPDATE categories SET name = ?, description = ? WHERE id = ? AND is_active = TRUE',
      [name, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const [updatedCategory] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    // Check if category has products
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ? AND is_active = TRUE',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing products' 
      });
    }

    const [result] = await pool.execute(
      'UPDATE categories SET is_active = FALSE WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router; 