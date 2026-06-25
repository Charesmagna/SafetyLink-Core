module.exports = {
  apps: [{
    name:         'safetylink-backend',
    script:       'backend/src/app.js',
    cwd:          '/app',
    instances:    'max',
    exec_mode:    'cluster',
    watch:        false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT:     3000,
    },
    error_file: '/var/log/pm2/safetylink-error.log',
    out_file:   '/var/log/pm2/safetylink-out.log',
    time:       true,
  }],
};
