// sqlconnection.js
const sql = require('mssql/msnodesqlv8');

const config = {
  server: 'DESKTOP-I877JG5\\SQLEXPRESS',
  database: 'BIITDBNew',
  options: {
    trustedConnection: true  // Uses current Windows user
  }
};

module.exports = config;