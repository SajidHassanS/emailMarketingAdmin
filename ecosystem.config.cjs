module.exports = {
  apps: [
    {
      name: "admin",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
        DOMAIN: "https://agoradanceback.app",
        PORT: 7001,
        DATABASE_URL:
          "postgresql://postgres:hassan526688@project3.c7q4kemc23tb.eu-north-1.rds.amazonaws.com:5432/project3",
        // DATABASE_NAME: "project3",
        JWT_SECRET_KEY:
          "8ce1c81b3c7a299f8d4be0dd174c5c295a5f9b6e4f6e4b6cd6c7f1d9a0e1f2e6e5b2b0c6d4d0a5e3c2f8f5f9b7e5e3d5f6f2d4c9b3f5f3a1f6e3f8c7e3a6",
        EMAIL: "greenageservices@gmail.com",
        EMAIL_PASS: "dvdv qnxh exft qqde",
      },
    },
  ],
};
