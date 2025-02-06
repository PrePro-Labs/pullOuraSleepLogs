import mysql from "mysql2/promise";

// prepro userId
export const userId = process.env.PREPRO_USER_ID;

// oura api token
export const ouraApiKey = process.env.OURA_API_KEY;

// mysql config
const dbConfig = {
  connectionLimit: 5,
  host: process.env.MYSQL_CONNECTION_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
};

export const poolPromise = (async function () {
  try {
    const pool = await mysql.createPool(dbConfig);

    console.log("Connected to MySQL Database");

    return pool;
  } catch (err) {
    console.log("MySQL Database Connection Failed! Bad Config: ", err);
    throw err;
  }
})();
