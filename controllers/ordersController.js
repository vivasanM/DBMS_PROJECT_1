const pool = require("../db");

// ✅ Get all orders
const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Orders ORDER BY OrderDate DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching orders");
  }
};

// ✅ Get order by ID
const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const orderRes = await pool.query("SELECT * FROM Orders WHERE OrderID = $1", [id]);
    if (orderRes.rows.length === 0) return res.status(404).send("Order not found");

    // Fetch order items
    const itemsRes = await pool.query("SELECT * FROM OrderItems WHERE OrderID = $1", [id]);

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching order");
  }
};

// ✅ Create order with items
const createOrder = async (req, res) => {
  const { userId, status, items } = req.body; // items = [{bookId, quantity, price}]
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Calculate total amount
    let totalAmount = 0;
    items.forEach(item => totalAmount += item.quantity * item.price);

    // Insert order
    const orderRes = await client.query(
      "INSERT INTO Orders (UserID, TotalAmount, Status) VALUES ($1, $2, $3) RETURNING *",
      [userId, totalAmount, status || "Pending"]
    );

    const orderId = orderRes.rows[0].orderid;

    // Insert order items
    for (let item of items) {
      await client.query(
        `INSERT INTO OrderItems (OrderID, BookID, Quantity, Price, Amount)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.bookId, item.quantity, item.price, item.quantity * item.price]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ orderId, totalAmount, items });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).send("Error creating order");
  } finally {
    client.release();
  }
};

// ✅ Delete order (cascade deletes items)
const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM Orders WHERE OrderID=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("Order not found");
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting order");
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  deleteOrder,
};
