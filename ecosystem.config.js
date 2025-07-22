module.exports = {
  apps: [{
    name: 'adoptbamboo',
    script: 'server.js',
    cwd: '/www/wwwroot/adopta.bambooinnovasia.com',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0'
    },
    error_file: '/www/wwwroot/adopta.bambooinnovasia.com/logs/err.log',
    out_file: '/www/wwwroot/adopta.bambooinnovasia.com/logs/out.log',
    log_file: '/www/wwwroot/adopta.bambooinnovasia.com/logs/combined.log',
    time: true
  }]
};