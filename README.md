# Complex Database Query Engine

Node.js + Express app with PostgreSQL backend. Supports **CLI** and **REST APIs** for queries, orders, and CSV export.

---

## 📦 Features
- Product **recommendations** with pagination  
- **High value users** search with pagination  
- **Top-selling product** per user  
- **Place orders** with stock update  
- **Export results** to CSV  

---

## ⚡ Installation
```bash
git clone https://github.com/BhavyaJhunjhunuwala/ComplexDatabaseQueryEngine.git
npm install
node server.js   # start server
node index.js    # CLI mode
```

## API Endpoints
1. GET /recommendations/:userId
```
GET /recommendations/1?page=1&pageSize=5
```
2. GET /highvalueusers/:value
   ```
   GET /highvalueusers/500?page=1&pageSize=5
   ```
3. GET /topproducts/:userId
   ```
   GET /topproducts/1
   ```
4. POST /placeorder
   ```
   { "userId": 1, "productId": 2, "quantity": 5 }
   ```
5. POST /export/:queryType
   ```
   POST /export/recommendations?userId=1&page=1&pageSize=5
   POST /export/highvalueusers?value=500&page=1&pageSize=10
   POST /export/topproducts?userId=1
    ```
CLI Commands
```
recommendations <userId> <page> <pageSize>
highvalueusers <value> <page> <pageSize>
topproducts <userId>
placeorder <userId> <productId> <quantity>
export <queryType>
exit
```


