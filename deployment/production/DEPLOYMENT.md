# SMSTK Production Deployment Guide

## Prerequisites
- Node.js 18+
- MySQL 8.0+
- PM2 (recommended for process management)

## Installation Steps

1. **Upload files to server**
   ```bash
   # Upload the production folder to your server
   ```

2. **Install dependencies**
   ```bash
   cd production
   npm install --production
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Setup database**
   - Create MySQL database
   - Import schema or let the app create tables automatically
   - Update .env with database credentials

5. **Start the application**
   ```bash
   # Using PM2 (recommended)
   npm install -g pm2
   pm2 start index.js --name smstk
   pm2 startup
   pm2 save
   
   # Or using Node directly
   npm start
   ```

6. **Setup reverse proxy (Nginx/Apache)**
   - Configure to proxy requests to port 5000
   - Setup SSL certificate
   - Configure domain

## Environment Variables

Make sure to update the following in your .env file:
- `DB_HOST`: Your database host
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Strong secret key for JWT
- `CORS_ORIGIN`: Your frontend domain

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
