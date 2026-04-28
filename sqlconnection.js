
// const config = {
//   server: 'DESKTOP-DBGMHUM\\SQLEXPRESS',
//   database: 'BIITDBNew',
//   driver: 'msnodesqlv8',
//   options: {
//     trustedConnection: true,
//     trustServerCertificate: true
//   }
// };
 
// module.exports = config; 

const config = {
  driver: 'msnodesqlv8',
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-DBGMHUM\\SQLEXPRESS;Database=BIITDBNew;Trusted_Connection=yes;TrustServerCertificate=yes;"
};

module.exports = config;