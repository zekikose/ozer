module.exports = {
  apps: [{
    name: 'smstk',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/smstk-error.log',
    out_file: '/var/log/pm2/smstk-out.log',
    log_file: '/var/log/pm2/smstk-combined.log',
    time: true
  }]
};




