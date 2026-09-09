module.exports = {
  apps: [
    {
      name: "waply-web",
      cwd: "./apps/web",
      script: "npm",
      args: "run start",
      env: {
        PORT: 3001,
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/web-error.log",
      out_file: "./logs/web-out.log",
    },
    {
      name: "waply-gateway",
      cwd: "./apps/gateway",
      script: "npm",
      args: "run start",
      env: {
        PORT: 3002,
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1.5G",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "./logs/gateway-error.log",
      out_file: "./logs/gateway-out.log",
    },
  ],
};
