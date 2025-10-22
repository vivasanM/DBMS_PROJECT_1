// accountsController.js
const pool = require("../db");

// ✅ Get all accounts
async function getAllAccounts(req, res) {
  try {
    const result = await pool.query("SELECT * FROM Accounts ORDER BY AccountID");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}

// ✅ Get account by ID
async function getAccountById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM Accounts WHERE AccountID = $1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Account not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}

// ✅ Create new account
async function createAccount(req, res) {
  const { accountname, accounttype } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO Accounts (AccountName, AccountType, Balance) VALUES ($1, $2, 0) RETURNING *",
      [accountname, accounttype]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error creating account");
  }
}

// ✅ Update account details (name/type)
async function updateAccount(req, res) {
  const { id } = req.params;
  const { accountname, accounttype } = req.body;
  try {
    const result = await pool.query(
      "UPDATE Accounts SET AccountName=$1, AccountType=$2 WHERE AccountID=$3 RETURNING *",
      [accountname, accounttype, id]
    );
    if (result.rows.length === 0) return res.status(404).send("Account not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error updating account");
  }
}

// ✅ Delete account
async function deleteAccount(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM Accounts WHERE AccountID=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("Account not found");
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error deleting account");
  }
}

// ✅ Update balance (credit/debit)
async function updateBalance(req, res) {
  const { id } = req.params;
  const { amount, type } = req.body; // type = CREDIT or DEBIT

  if (!["CREDIT", "DEBIT"].includes(type.toUpperCase())) {
    return res.status(400).send("Invalid transaction type");
  }

  try {
    const client = await pool.connect();
    await client.query("BEGIN");

    // Get current balance
    const accountRes = await client.query("SELECT Balance FROM Accounts WHERE AccountID=$1 FOR UPDATE", [id]);
    if (accountRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).send("Account not found");
    }

    let newBalance = parseFloat(accountRes.rows[0].balance);
    if (type.toUpperCase() === "CREDIT") {
      newBalance += parseFloat(amount);
    } else {
      newBalance -= parseFloat(amount);
      if (newBalance < 0) {
        await client.query("ROLLBACK");
        return res.status(400).send("Insufficient balance");
      }
    }

    const updateRes = await client.query(
      "UPDATE Accounts SET Balance=$1 WHERE AccountID=$2 RETURNING *",
      [newBalance, id]
    );

    await client.query("COMMIT");
    res.json(updateRes.rows[0]);
  } catch (err) {
    console.error(err.message);
    await pool.query("ROLLBACK");
    res.status(500).send("Error updating balance");
  }
}

module.exports = {
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  updateBalance,
};
