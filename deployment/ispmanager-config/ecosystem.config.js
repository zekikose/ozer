module.exports = {
  apps: [{
    name: 'smstk-backend',
    script: 'index.js',
    instances: 'max', // CPU çekirdek sayısı kadar instance
    exec_mode: 'cluster', // Cluster mode
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
    // Log dosyaları
    error_file: '../logs/err.log',
    out_file: '../logs/out.log',
    log_file: '../logs/combined.log',
    time: true,
    // Log formatı
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Restart politikası
    min_uptime: '10s',
    max_restarts: 10,
    // Monitoring
    pmx: true,
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Environment variables
    env_file: '.env',
    // Cron restart (her gece 03:00'da)
    cron_restart: '0 3 * * *',
    // Node.js options
    node_args: '--max-old-space-size=2048',
    // Interpreter
    interpreter: 'node',
    // Working directory
    cwd: '/var/www/yourdomain.com/backend',
    // User
    user: 'www-data',
    // Group
    group: 'www-data',
    // Umask
    umask: '022',
    // Merge logs
    merge_logs: true,
    // Log type
    log_type: 'json',
    // Source map support
    source_map_support: true,
    // Disable source map
    disable_source_map_support: false,
    // Instance var
    instance_var: 'INSTANCE_ID',
    // Namespace
    namespace: 'smstk',
    // Filter env
    filter_env: ['NODE_ENV'],
    // Watch options
    watch_options: {
      followSymlinks: false,
      usePolling: true
    },
    // Ignore watch
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      'uploads',
      '.git'
    ],
    // Watch delay
    watch_delay: 1000,
    // Force restart
    force: false,
    // Wait ready
    wait_ready: true,
    // Listen timeout
    listen_timeout: 3000,
    // Kill timeout
    kill_timeout: 5000,
    // Shutdown with message
    shutdown_with_message: true,
    // Tree kill
    tree_kill: true,
    // Treekill signal
    treekill_signal: 'SIGTERM',
    // Auto restart
    autorestart: true,
    // Restart delay
    restart_delay: 4000,
    // Exp backoff restart delay
    exp_backoff_restart_delay: 100,
    // Max restart delay
    max_restart_delay: 60000,
    // Min uptime
    min_uptime: '10s',
    // Max restarts
    max_restarts: 10,
    // Unstable restart
    unstable_restarts: 0,
    // Cron restart
    cron_restart: '0 3 * * *',
    // Write
    write: true,
    // Log file
    log_file: '../logs/combined.log',
    // Out file
    out_file: '../logs/out.log',
    // Error file
    error_file: '../logs/err.log',
    // Log date format
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Merge logs
    merge_logs: true,
    // Log type
    log_type: 'json',
    // Source map support
    source_map_support: true,
    // Disable source map
    disable_source_map_support: false,
    // Instance var
    instance_var: 'INSTANCE_ID',
    // Namespace
    namespace: 'smstk',
    // Filter env
    filter_env: ['NODE_ENV'],
    // Watch options
    watch_options: {
      followSymlinks: false,
      usePolling: true
    },
    // Ignore watch
    ignore_watch: [
      'node_modules',
      'logs',
      '*.log',
      'uploads',
      '.git'
    ],
    // Watch delay
    watch_delay: 1000,
    // Force restart
    force: false,
    // Wait ready
    wait_ready: true,
    // Listen timeout
    listen_timeout: 3000,
    // Kill timeout
    kill_timeout: 5000,
    // Shutdown with message
    shutdown_with_message: true,
    // Tree kill
    tree_kill: true,
    // Treekill signal
    treekill_signal: 'SIGTERM'
  }],

  // Deployment konfigürasyonu
  deploy: {
    production: {
      user: 'www-data',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/smstk.git',
      path: '/var/www/yourdomain.com',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 