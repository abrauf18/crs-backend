module.exports = {
  apps: [
    {
      name: "crs-backend",
      script: "./index.js",
      instances: 1,
      autorestart: true,
      watch: true,
    },
  ],
};
