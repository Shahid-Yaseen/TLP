module.exports = {
  apps: [{
    name: 'tlp-api',
    script: './index.js',
    cwd: '/opt/tlp/api',
    instances: 2,
    exec_mode: 'cluster',
    // Let the app load .env file itself - don't override with defaults
    // PM2 will pass through environment variables, and the app will load .env
    env_file: '/opt/tlp/api/.env',  // PM2 will load this if supported
    env: {
      NODE_ENV: 'production',
      // Only set PORT if needed, let .env handle DB config
      PORT: 3007,
    },
    error_file: '/var/log/pm2/tlp-api-error.log',
    out_file: '/var/log/pm2/tlp-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};

