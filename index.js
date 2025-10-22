const express = require("express");
const bodyParser = require("body-parser");
const accountsRoutes = require("./routes/accountsRoutes");
const userRoutes = require("./routes/userRoutes");
const transactionsRoutes = require("./routes/transactionsRoutes");
const booksRoutes = require("./routes/booksRoutes");
const auditRoutes = require("./routes/auditRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const orderItemsRoutes = require("./routes/orderItemsRoutes");
var cors = require('cors')


const setupDatabase = require("./setup");

const app = express();
const port = 3000;

// CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from specific origins
    const allowedOrigins = ['http://127.0.0.1:8080']; // your frontend URL
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

// Middleware
app.use(bodyParser.json());
app.use('/api', cors(corsOptions));

// Routes
app.use("/api/accounts", accountsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/orders", ordersRoutes);          // Orders CRUD
app.use("/api/order-items", orderItemsRoutes); // Order items CRUD

// Run setup before starting server
setupDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
