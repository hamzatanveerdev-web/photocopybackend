// index.js
const express = require('express');
const sql = require('mssql/msnodesqlv8'); 
const cors = require('cors');
const routes = require('./Routes/routes');
const app = express();
const PORT = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

app.use('/api', routes); 


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

