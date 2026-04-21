const sql = require('mssql/msnodesqlv8');
const config = require('./sqlconnection');

const poolPromise = new sql.ConnectionPool(config).connect().then(pool =>
   {
    console.log("✅ Database Connected");
    return pool;
  }).catch(err =>
   {
    console.log("❌ DB Connection Failed:", err);
  });

module.exports = {
  sql,
  poolPromise
};