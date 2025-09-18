const express = require('express');
const { initDatabase } = require('./db/connection');
const { getRecommendations, getHighValueUsers, getTopProductsPerUser } = require('./db/queries');
const { placeOrder } = require('./db/transactions');
const { exportToCSV } = require('./db/export');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize database on startup
initDatabase()
  .then(() => console.log('Database initialized successfully.'))
  .catch((err) => {
    console.error('Startup error:', err.message);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Welcome to Assignment 3 Solutions.');
});

// GET /recommendations/:userId - Get product recommendations with pagination
app.get('/recommendations/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5; // Page size
    const offset = (page - 1) * pageSize;
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const results = await getRecommendations(userId, pageSize, page);
   
   
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /highvalueusers - Get users with total order value > $1000
app.get('/highvalueusers/:value', async (req, res) => {
  try {
    const vlu=parseInt(req.params.value) || 1000
    const page=req.query.page ? parseInt(req.query.page) : 1;
    const pageSize=req.query.pageSize ? parseInt(req.query.pageSize) : 5;
    // const offset = (page - 1) * pageSize;
    const results = await getHighValueUsers(vlu,pageSize,page);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /topproducts/:userId - Get top-selling product for a user
app.get('/topproducts/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const results = await getTopProductsPerUser(userId);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// POST /placeorder - Place an order and update stock
app.post('/placeorder', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    if (!Number.isInteger(userId) || !Number.isInteger(productId) || !Number.isInteger(quantity)) {
      return res.status(400).json({ error: 'Invalid input: userId, productId, and quantity must be integers' });
    }
    await placeOrder(userId, productId, quantity);
    res.json({ message: 'Order placed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Post /export/:queryType - Export last query results to CSV
app.post('/export/:queryType', async (req, res) => {
  try {
    // Note: This is a simplified example; in a real app, you'd cache results server-side
    const queryType = req.params.queryType;
    let results;
    if (queryType === 'recommendations') {
      const userId = parseInt(req.query.userId);
      const page = parseInt(req.query.page);
      const pageSize = parseInt(req.query.pageSize); // Page size
      console.log(`Fetching recommendations for userId=${userId}, page=${page}, pageSize=${pageSize}`);
      
      
      results = await getRecommendations(userId, pageSize, page);
      results=results.result; // Extract data array
    } 
    
    else if (queryType === 'highvalueusers') {
      const vlu=parseInt(req.query.value) || 1000
      const page=req.query.page ? parseInt(req.query.page) : 1;
      const pageSize=req.query.pageSize ? parseInt(req.query.pageSize) : 5;


      console.log(`Fetching high value users with value>${vlu}, page=${page}, pageSize=${pageSize}`);

      results = await getHighValueUsers(vlu,pageSize,page);
      results=results.data; // Extract data array
    } 
    
    else if (queryType === 'topproducts') {
      const userId = parseInt(req.query.userId) || 1;
      results = await getTopProductsPerUser(userId);
    } 
    
    
    else {
      return res.status(400).json({ error: 'Invalid queryType' });
    }


    if (results.length === 0) {
      return res.status(404).json({ error: 'No results to export' });
    }
    await exportToCSV(results, `${queryType}.csv`);
    res.download(`${queryType}.csv`);
  } 
  
  
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
