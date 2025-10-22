const pool = require("../db");

// Get all books
async function getAllBooks(req, res) {
  try {
    const result = await pool.query("SELECT * FROM Books ORDER BY BookID");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Get book by ID
async function getBookById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM Books WHERE BookID=$1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Book not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Create book
async function createBook(req, res) {
  const { title, author, price, stock } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO Books (Title, Author, Price, Stock) VALUES ($1,$2,$3,$4) RETURNING *",
      [title, author, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error creating book");
  }
}

// Update book
async function updateBook(req, res) {
  const { id } = req.params;
  const { title, author, price, stock } = req.body;
  try {
    const result = await pool.query(
      "UPDATE Books SET Title=$1, Author=$2, Price=$3, Stock=$4 WHERE BookID=$5 RETURNING *",
      [title, author, price, stock, id]
    );
    if (result.rows.length === 0) return res.status(404).send("Book not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error updating book");
  }
}

// Delete book
async function deleteBook(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM Books WHERE BookID=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("Book not found");
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error deleting book");
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
