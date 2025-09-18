const readline = require('readline');
const { initDatabase } = require('./db/connection');
const { getRecommendations, getHighValueUsers, getTopProductsPerUser } = require('./db/queries');
const { placeOrder } = require('./db/transactions');
const { exportToCSV } = require('./db/export');

// CLI Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

async function main() {
  try {
    await initDatabase(); // Initialize database
    console.log('Database initialized successfully.');

    console.log('CLI Commands:');
    console.log('1. recommendations <userId> <page1> <pageSize> - Get recommendations with pagination (page size 5)');
    console.log('2. highvalueusers <value> <page1> <pageSize> - Get users with total > $value with pagination (page size 5)');
    console.log('3. topproducts <userId> - Get top product for user');
    console.log('4. placeorder <userId> <productId> <quantity> - Place order with transaction');
    console.log('5. export <queryType> - Export last query results to CSV (e.g., export recommendations)');
    console.log('exit - Quit');

    let lastResults = [];

    rl.prompt();

    rl.on('line', async (line) => {
      const args = line.trim().split(' ');
      const command = args[0];

      try {


        if (command === 'recommendations') {
          const userId = parseInt(args[1]) || 1;
          const page = args[2] ? parseInt(args[2]) : 1;
          const pageSize = args[3] ? parseInt(args[3]) : 5; // Page size
          // const offset = (page - 1) * limit;
          lastResults = await getRecommendations(userId, pageSize, page);
          console.log('Recommendations:', lastResults);
        } 
        
        
        else if (command === 'highvalueusers') {
          const vlu=parseInt(args[1]) || 1000
        
          const page = args[2] ? parseInt(args[2]) : 1;
          const pageSize = args[3] ? parseInt(args[3]) : 5;

          lastResults = await getHighValueUsers(vlu,pageSize,page);
          console.log('High value users:', lastResults);
        } 
        

        else if (command === 'topproducts') {
          const userId = parseInt(args[1]);
          lastResults = await getTopProductsPerUser(userId);
          console.log('Top products:', lastResults);
        } 
        

        else if (command === 'placeorder') {
          const userId = parseInt(args[1]);
          const productId = parseInt(args[2]);
          const quantity = parseInt(args[3]);
          await placeOrder(userId, productId, quantity);
          console.log('Order placed successfully.');
        }
        
        
        else if (command === 'export') {
          
          const queryType = args[1];
          
          console.log(`Exporting results for query type: ${queryType}`);
         
          if(queryType==='highvalueusers'){
           
            const vlu=parseInt(args[2]) || 1000
            const page = args[3] ? parseInt(args[3]) : 1;
            const pageSize = args[4] ? parseInt(args[4]) : 5;

            lastResults = await getHighValueUsers(vlu,pageSize,page);
            lastResults=lastResults.data;
            console.log(lastResults);
          }


          else if(queryType==='recommendations'){
            const userId = parseInt(args[2]) || 1;
            const page = args[3] ? parseInt(args[3]) : 1;
            const pageSize = args[4] ? parseInt(args[4]) : 5; // Page size
            console.log(`Fetching recommendations for userId=${userId}, page=${page}, pageSize=${pageSize}`);
          
            lastResults = await getRecommendations(userId, pageSize, page);
            lastResults=lastResults.result; // Extract data array
          }
          else if(queryType==='topproducts'){
            const userId = parseInt(args[2]);
            lastResults = await getTopProductsPerUser(userId);
          }
          
          if (lastResults.length > 0) { 
            await exportToCSV(lastResults, `${queryType}.csv`);
            console.log(`Exported to ${queryType}.csv`);
          } else {
            console.log('No results to export.');
          }
        } else if (command === 'exit') {
          rl.close();
        } else {
          console.log('Unknown command.');
        }
      } catch (err) {
        console.error('Error:', err.message);
      }
      rl.prompt();
    });

    rl.on('close', async () => {
      console.log('Closing application...');
      process.exit(0);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
}

main();

