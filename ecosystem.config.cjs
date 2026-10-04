module.exports = {
  apps: [
    {
      name: 'taskmandu-backend',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5010
      }
    },
    {
      name: 'taskmandu-frontend',
      cwd: './frontend',
      script: 'serve',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 3010,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      }
    }
  ]
};
