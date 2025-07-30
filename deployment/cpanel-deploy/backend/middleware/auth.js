const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// JWT token doğrulama middleware'i
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcı bilgilerini veritabanından al
    const [users] = await pool.execute(
      'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0 || !users[0].is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Rol tabanlı yetkilendirme middleware'i
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Yetki kontrolü için yardımcı fonksiyonlar
const hasPermission = (userRole, requiredPermission) => {
  const permissions = {
    admin: [
      'dashboard:read',
      'products:read', 'products:create', 'products:update', 'products:delete',
      'categories:read', 'categories:create', 'categories:update', 'categories:delete',
      'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
      'customers:read', 'customers:create', 'customers:update', 'customers:delete',
      'warehouses:read', 'warehouses:create', 'warehouses:update', 'warehouses:delete',
      'stock:read', 'stock:in', 'stock:out', 'stock:adjustment',
      'users:read', 'users:create', 'users:update', 'users:delete',
      'reports:read', 'settings:read', 'settings:update'
    ],
    manager: [
      'dashboard:read',
      'products:read', 'products:create', 'products:update',
      'categories:read', 'categories:create', 'categories:update',
      'suppliers:read', 'suppliers:create', 'suppliers:update',
      'customers:read', 'customers:create', 'customers:update',
      'warehouses:read', 'warehouses:create', 'warehouses:update',
      'stock:read', 'stock:in', 'stock:out', 'stock:adjustment',
      'reports:read', 'settings:read'
    ],
    stock_keeper: [
      'dashboard:read',
      'products:read',
      'categories:read',
      'suppliers:read',
      'customers:read',
      'warehouses:read',
      'stock:read', 'stock:in', 'stock:out'
    ],
    viewer: [
      'dashboard:read',
      'products:read',
      'categories:read',
      'suppliers:read',
      'customers:read',
      'warehouses:read',
      'stock:read'
    ]
  };

  return permissions[userRole]?.includes(requiredPermission) || false;
};

// Özel yetki kontrolü middleware'i
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission,
        current: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorize,
  hasPermission,
  checkPermission
}; 