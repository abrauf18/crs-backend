module.exports = {
  apps: [
    {
      name: "crs-backend",
      script: "./index.js",
      watch: true,
      ignore_watch: "node_modules",
      time: true,
      out_file: "./scripts.txt",
      error_file: "./error.txt",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
