const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { checkPermission } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', checkPermission('users:read'), async (req, res) => {
  try {
    const [users] = await pool.execute(`
      SELECT 
        id, username, email, full_name, role, is_active, created_at,
        last_login
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', checkPermission('users:read'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', checkPermission('users:create'), [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('full_name')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .isIn(['admin', 'manager', 'stock_keeper', 'viewer'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, full_name, password, role } = req.body;

    // Check if username already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const [existingEmails] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, full_name, password, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, full_name, hashedPassword, role]
    );

    // Get created user
    const [newUser] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', checkPermission('users:update'), [
  // Validate id parameter first
  (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    next();
  },
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('full_name')
    .isLength({ min: 2 })
    .withMessage('Full name must be at least 2 characters'),
  body('role')
    .isIn(['admin', 'manager', 'stock_keeper', 'viewer'])
    .withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, full_name, password, role } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email already exists (excluding current user)
    const [existingEmails] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );

    if (existingEmails.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Prepare update data
    let updateQuery = 'UPDATE users SET email = ?, full_name = ?, role = ?';
    let updateParams = [email, full_name, role];

    // Add password to update if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(userId);

    await pool.execute(updateQuery, updateParams);

    // Get updated user
    const [updatedUser] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (soft delete)
router.delete('/:id', checkPermission('users:delete'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const userId = id;

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin user
    if (existingUser[0].role === 'admin') {
      const [adminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = TRUE'
      );

      if (adminCount[0].count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Soft delete user
    await pool.execute(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Toggle user status
router.patch('/:id/status', checkPermission('users:update'), [
  body('is_active')
    .isBoolean()
    .withMessage('is_active must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { is_active } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deactivating the last admin user
    if (existingUser[0].role === 'admin' && !is_active) {
      const [adminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = TRUE'
      );

      if (adminCount[0].count <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last admin user' });
      }
    }

    // Update user status
    await pool.execute(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [is_active, userId]
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Update last login
router.patch('/:id/last-login', async (req, res) => {
  try {
    const userId = req.params.id;

    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [userId]
    );

    res.json({ message: 'Last login updated successfully' });
  } catch (error) {
    console.error('Update last login error:', error);
    res.status(500).json({ error: 'Failed to update last login' });
  }
});

module.exports = router; 