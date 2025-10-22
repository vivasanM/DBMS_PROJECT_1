const pool = require("../db");

// CREATE user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      `SELECT * FROM Users WHERE Email = $1`,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    // Insert new user
    const result = await pool.query(
      `INSERT INTO Users (Name, Email, Password, Role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, password, role || "accountant"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
};


// LOGIN user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const userResult = await pool.query(
      `SELECT * FROM Users WHERE Email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    // For plain text password comparison (not secure)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Optional: generate JWT token here
    // const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error logging in user");
  }
};



// READ all users
const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Users ORDER BY UserID ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
};

// READ one user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM Users WHERE UserID = $1", [id]);
    if (result.rows.length === 0) return res.status(404).send("User not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user");
  }
};

// UPDATE user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    const result = await pool.query(
      `UPDATE Users
       SET Name = $1, Email = $2, Password = $3, Role = $4
       WHERE UserID = $5
       RETURNING *`,
      [name, email, password, role || "accountant", id]
    );
    if (result.rows.length === 0) return res.status(404).send("User not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user");
  }
};

// DELETE user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM Users WHERE UserID = $1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("User not found");
    res.send("User deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting user");
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  loginUser,
};
