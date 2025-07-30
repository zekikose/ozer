#!/bin/bash

echo "🚀 SMSTK Production Build Script"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Build client
echo "🔨 Building React client..."
cd client
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Failed to build client"
    exit 1
fi

cd ..

# Create production directory
echo "📁 Creating production directory..."
mkdir -p production
cp -r server/* production/
cp -r client/build production/public

# Create production package.json
cat > production/package.json << EOF
{
  "name": "smstk-production",
  "version": "1.0.0",
  "description": "SMSTK Production Build",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create production .env template
cat > production/.env.example << EOF
# Production Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Create deployment instructions
cat > production/DEPLOYMENT.md << EOF
# SMSTK Production Deployment Guide

## Prerequisites
- Node.js 18+
- MySQL 8.0+
- PM2 (recommended for process management)

## Installation Steps

1. **Upload files to server**
   \`\`\`bash
   # Upload the production folder to your server
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   cd production
   npm install --production
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your actual values
   \`\`\`

4. **Setup database**
   - Create MySQL database
   - Import schema or let the app create tables automatically
   - Update .env with database credentials

5. **Start the application**
   \`\`\`bash
   # Using PM2 (recommended)
   npm install -g pm2
   pm2 start index.js --name smstk
   pm2 startup
   pm2 save
   
   # Or using Node directly
   npm start
   \`\`\`

6. **Setup reverse proxy (Nginx/Apache)**
   - Configure to proxy requests to port 5000
   - Setup SSL certificate
   - Configure domain

## Environment Variables

Make sure to update the following in your .env file:
- \`DB_HOST\`: Your database host
- \`DB_USER\`: Database username
- \`DB_PASSWORD\`: Database password
- \`DB_NAME\`: Database name
- \`JWT_SECRET\`: Strong secret key for JWT
- \`CORS_ORIGIN\`: Your frontend domain

## Security Notes
- Change default admin password
- Use strong JWT secret
- Enable HTTPS
- Configure firewall
- Regular backups

## Monitoring
- Use PM2 for process management
- Setup log rotation
- Monitor database performance
- Setup alerts for errors

## Backup
- Regular database backups
- Application file backups
- Configuration backups
EOF

# Create PM2 ecosystem file
cat > production/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smstk',
    script: 'index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create logs directory
mkdir -p production/logs

# Create .gitignore for production
cat > production/.gitignore << EOF
node_modules/
.env
logs/
*.log
npm-debug.log*
EOF

echo "✅ Production build completed successfully!"
echo "📁 Production files are in the 'production' directory"
echo "📖 See production/DEPLOYMENT.md for deployment instructions"
echo ""
echo "🚀 Next steps:"
echo "1. Upload 'production' folder to your server"
echo "2. Configure .env file with your settings"
echo "3. Install dependencies: npm install --production"
echo "4. Start the application: npm start"
echo ""
echo "📚 For detailed instructions, see: production/DEPLOYMENT.md" 