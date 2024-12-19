// import dotenv from "dotenv";
// dotenv.config();
process.loadEnvFile();

const config = {
  dbUri: process.env.DB_URI || "mongodb://localhost/mydatabase",
  port: process.env.PORT || 3000
  // secret: process.env.SECRET || 'mysecretkey'
};

export default config;
