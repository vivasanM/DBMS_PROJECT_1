const pool = require("../db");

// ✅ Get all transactions
async function getAllTransactions(req, res) {
  try {
    const result = await pool.query("SELECT * FROM Transactions ORDER BY TransactionDate DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// ✅ Get transaction by ID
async function getTransactionById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM Transactions WHERE TransactionID = $1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Transaction not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// ✅ Create transaction
async function createTransaction(req, res) {
  const { accountId, userId, categoryId, amount, transactionType, description } = req.body;

  if (!["CREDIT", "DEBIT"].includes(transactionType.toUpperCase())) {
    return res.status(400).send("Invalid transaction type");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock account row for update
    const accountRes = await client.query(
      "SELECT Balance FROM Accounts WHERE AccountID=$1 FOR UPDATE",
      [accountId]
    );

    if (accountRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send("Account not found");
    }

    let newBalance = parseFloat(accountRes.rows[0].balance);
    if (transactionType.toUpperCase() === "CREDIT") {
      newBalance += parseFloat(amount);
    } else {
      newBalance -= parseFloat(amount);
      if (newBalance < 0) {
        await client.query("ROLLBACK");
        return res.status(400).send("Insufficient balance");
      }
    }

    // Update account balance
    await client.query(
      "UPDATE Accounts SET Balance=$1 WHERE AccountID=$2",
      [newBalance, accountId]
    );

    // Insert transaction
    const insertRes = await client.query(
      `INSERT INTO Transactions (AccountID, UserID, CategoryID, Amount, TransactionType, Description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [accountId, userId, categoryId, amount, transactionType, description]
    );

    await client.query("COMMIT");
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).send("Error creating transaction");
  } finally {
    client.release();
  }
}

// ✅ Delete transaction (rollback balance)
async function deleteTransaction(req, res) {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const txnRes = await client.query(
      "SELECT * FROM Transactions WHERE TransactionID=$1",
      [id]
    );

    if (txnRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send("Transaction not found");
    }

    const txn = txnRes.rows[0];

    // Adjust account balance
    const accountRes = await client.query(
      "SELECT Balance FROM Accounts WHERE AccountID=$1 FOR UPDATE",
      [txn.accountid]
    );

    let newBalance = parseFloat(accountRes.rows[0].balance);
    if (txn.transactiontype === "CREDIT") {
      newBalance -= parseFloat(txn.amount);
    } else {
      newBalance += parseFloat(txn.amount);
    }

    await client.query("UPDATE Accounts SET Balance=$1 WHERE AccountID=$2", [newBalance, txn.accountid]);
    await client.query("DELETE FROM Transactions WHERE TransactionID=$1", [id]);

    await client.query("COMMIT");
    res.json({ message: "Transaction deleted and balance updated" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err.message);
    res.status(500).send("Error deleting transaction");
  } finally {
    client.release();
  }
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  deleteTransaction,
};
