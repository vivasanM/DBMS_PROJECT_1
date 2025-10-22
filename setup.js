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
        ImageLink VARCHAR(255), 
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

     async function resetAndInsertBooks(client) {
    await client.query(`DELETE FROM Books`);
    console.log("All existing entries deleted.");

     const sampleBooks = [
    { title: "The Martian", author: "Andy Weir", price: 500, stock: 10, imageLink: "https://placehold.co/150x200/ed2c36/ffffff?text=Martian" },
    { title: "Project Hail Mary", author: "Andy Weir", price: 399, stock: 10, imageLink: "https://placehold.co/150x200/00a6e3/ffffff?text=Hail+Mary" },
    { title: "Dune", author: "Frank Herbert", price: 750, stock: 10, imageLink: "https://placehold.co/150x200/333333/ffffff?text=Dune" },
    { title: "Where the Crawdads Sing", author: "Delia Owens", price: 290, stock: 10, imageLink: "https://placehold.co/150x200/ed2c36/ffffff?text=Crawdads" },
    { title: "Sapiens: A Brief History", author: "Yuval Noah Harari", price: 699, stock: 10, imageLink: "https://placehold.co/150x200/6b7280/ffffff?text=Sapiens" },
    { title: "The Midnight Library", author: "Matt Haig", price: 587, stock: 10, imageLink: "https://placehold.co/150x200/f59e0b/ffffff?text=Midnight+Library" },
    { title: "1984", author: "George Orwell", price: 499, stock: 10, imageLink: "https://placehold.co/150x200/4f46e5/ffffff?text=1984" },
    { title: "12 Years: My Messed-up Love Story", author: "Chetan Bhagat", price: 299, stock: 10, imageLink: "https://images.unsplash.com/photo-1566915682737-3e97a7eed93b?w=600&auto=format&fit=crop&q=60" },
    { title: "The Secret of Secrets", author: "Dan Brown", price: 399, stock: 10, imageLink: "https://images.unsplash.com/photo-1604778367959-4ca516d798a7?q=80&w=758&auto=format&fit=crop" },
    { title: "Wiley's J.D. Lee Concise Inorganic Chemistry for JEE", author: "Sudarshan Guha", price: 549, stock: 10, imageLink: "https://media.istockphoto.com/id/1000158336/photo/chemistry-education-concept-open-books-with-text-chemistry-and-formulas-and-textbooks-flasks.webp" },
    { title: "Oswaal One for All Olympiads Previous Year Solved Papers (Book 1)", author: "Oswaal Editorial Board", price: 299, stock: 10, imageLink: "https://plus.unsplash.com/premium_photo-1731951687922-1bb9d7722a49?w=600&auto=format&fit=crop&q=60" },
    { title: "Oswaal One for All Olympiads Previous Year Solved Papers (Book 2)", author: "Oswaal Editorial Board", price: 299, stock: 10, imageLink: "https://plus.unsplash.com/premium_photo-1683141243517-5730698ff67f?w=600&auto=format&fit=crop&q=60" },
    { title: "The Midnight Library", author: "Matt Haig", price: 299, stock: 10, imageLink: "https://images.unsplash.com/photo-1521123845560-14093637aa7d?w=600&auto=format&fit=crop&q=60" },
    { title: "Atomic Habits", author: "James Clear", price: 399, stock: 10, imageLink: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60" },
    { title: "It Ends with Us", author: "Colleen Hoover", price: 349, stock: 10, imageLink: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=60" },
    { title: "The Alchemist", author: "Paulo Coelho", price: 299, stock: 10, imageLink: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=60" },
    { title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", price: 379, stock: 10, imageLink: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=60" },
    { title: "The Psychology of Money", author: "Morgan Housel", price: 399, stock: 10, imageLink: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHN5Y29sb2d5JTIwb2YlMjBtb25leXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600" },
    { title: "Ikigai", author: "Héctor García", price: 299, stock: 10, imageLink: "https://images.unsplash.com/photo-1544717305-996b815c338c?w=600&auto=format&fit=crop&q=60" },
    { title: "The Power", author: "James", price: 349, stock: 10, imageLink: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=60" },
    { title: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", price: 349, stock: 10, imageLink: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=60" },
    { title: "The Subtle Art of Not Giving a F*ck", author: "Mark Manson", price: 520, stock: 10, imageLink: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=60" },
    { title: "Deep Work", author: "Cal Newport", price: 640, stock: 10, imageLink: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=60" },
    { title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", price: 899, stock: 10, imageLink: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=60" },
    { title: "Ikigai: The Japanese Secret to a Long and Happy Life", author: "Héctor García & Francesc Miralles", price: 440, stock: 10, imageLink: "https://images.unsplash.com/photo-1544717305-996b815c338c?w=600&auto=format&fit=crop&q=60" },
    { title: "Can’t Hurt Me", author: "David Goggins", price: 699, stock: 10, imageLink: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=60" },
    { title: "The Alchemist", author: "Paulo Coelho", price: 379, stock: 10, imageLink: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=60" },
    { title: "Educated", author: "Tara Westover", price: 450, stock: 10, imageLink: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&auto=format&fit=crop&q=60" },
    { title: "The Midnight Library", author: "Matt Haig", price: 520, stock: 10, imageLink: "https://images.unsplash.com/photo-1521123845560-14093637aa7d?w=600&auto=format&fit=crop&q=60" },
    { title: "Atomic Habits", author: "James Clear", price: 525, stock: 10, imageLink: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&auto=format&fit=crop&q=60" }
  ];

    for (const book of sampleBooks) {
      await client.query(
        `INSERT INTO Books (Title, Author, Price, Stock, ImageLink) 
        VALUES ($1, $2, $3, $4, $5)`,
        [book.title, book.author, book.price, book.stock, book.imageLink]
      );
    }

    console.log("Sample books inserted successfully!");
  }
  await resetAndInsertBooks(client);


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
