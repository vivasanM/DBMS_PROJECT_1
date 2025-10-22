require("dotenv").config(); // load .env
const { Client } = require("pg");

const {
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME,
} = process.env;

// Utility function to check table existence
async function checkOrCreateTable(client, tableName, createSQL) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = $1
     )`,
    [tableName.toLowerCase()]
  );

  if (!res.rows[0].exists) {
    console.log(`🔧 Creating table "${tableName}"...`);
    await client.query(createSQL);
  } else {
    console.log(`✅ Table "${tableName}" already exists`);
  }
}

async function setupDatabase() {
  try {
    const client = new Client({
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
    });

    await client.connect();

    // Users table
    await checkOrCreateTable(client, "Users", `
      CREATE TABLE Users (
        UserID SERIAL PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Email VARCHAR(100) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Role VARCHAR(50) DEFAULT 'accountant',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Accounts table
    await checkOrCreateTable(client, "Accounts", `
      CREATE TABLE Accounts (
        AccountID SERIAL PRIMARY KEY,
        AccountName VARCHAR(100) NOT NULL,
        AccountType VARCHAR(50) NOT NULL,
        Balance DECIMAL(12,2) DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categories table
    await checkOrCreateTable(client, "Categories", `
      CREATE TABLE Categories (
        CategoryID SERIAL PRIMARY KEY,
        CategoryName VARCHAR(100) NOT NULL,
        Type VARCHAR(50) NOT NULL
      )
    `);

    // Transactions table
    await checkOrCreateTable(client, "Transactions", `
      CREATE TABLE Transactions (
        TransactionID SERIAL PRIMARY KEY,
        AccountID INT REFERENCES Accounts(AccountID) ON DELETE CASCADE,
        UserID INT REFERENCES Users(UserID),
        CategoryID INT REFERENCES Categories(CategoryID),
        Amount DECIMAL(12,2) NOT NULL,
        TransactionType VARCHAR(20) CHECK (TransactionType IN ('CREDIT','DEBIT')),
        Description VARCHAR(255),
        TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit_Log table
    await checkOrCreateTable(client, "Audit_Log", `
      CREATE TABLE Audit_Log (
        LogID SERIAL PRIMARY KEY,
        UserID INT REFERENCES Users(UserID),
        TableName VARCHAR(50),
        Action VARCHAR(50),
        OldValue TEXT,
        NewValue TEXT,
        ChangedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Books table
    await checkOrCreateTable(client, "Books", `
      CREATE TABLE Books (
        BookID SERIAL PRIMARY KEY,
        Title VARCHAR(150) NOT NULL,
        Author VARCHAR(100),
        Price DECIMAL(10,2),
        Stock INT DEFAULT 0,
        ImageName VARCHAR(255), 
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // BookSales table
    await checkOrCreateTable(client, "BookSales", `
      CREATE TABLE BookSales (
        SaleID SERIAL PRIMARY KEY,
        BookID INT REFERENCES Books(BookID) ON DELETE CASCADE,
        Quantity INT NOT NULL,
        TotalAmount DECIMAL(12,2) NOT NULL,
        TransactionID INT REFERENCES Transactions(TransactionID),
        SaleDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await checkOrCreateTable(client, "Orders", `
      CREATE TABLE Orders (
        OrderID SERIAL PRIMARY KEY,
        UserID INT REFERENCES Users(UserID),
        OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        TotalAmount DECIMAL(12,2) NOT NULL,
        Status VARCHAR(50) DEFAULT 'Pending'
      )
    `);

    // OrderItems table
    await checkOrCreateTable(client, "OrderItems", `
      CREATE TABLE OrderItems (
        OrderItemID SERIAL PRIMARY KEY,
        OrderID INT REFERENCES Orders(OrderID) ON DELETE CASCADE,
        BookID INT REFERENCES Books(BookID),
        Quantity INT NOT NULL,
        Price DECIMAL(10,2) NOT NULL, -- price at the time of order
        Amount DECIMAL(12,2) NOT NULL
      )
    `);

    console.log("✅ All tables checked/created successfully!");
    await client.end();

  } catch (err) {
    console.error("❌ Error setting up database:", err);
  }
}

module.exports = setupDatabase;
