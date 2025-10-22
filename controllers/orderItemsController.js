const pool = require("../db");

// ✅ Get items for a specific order
const getItemsByOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM OrderItems WHERE OrderID=$1", [orderId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching order items");
  }
};

// ✅ Update an order item
const updateOrderItem = async (req, res) => {
  const { id } = req.params; // OrderItemID
  const { quantity, price } = req.body;
  try {
    const amount = quantity * price;
    const result = await pool.query(
      "UPDATE OrderItems SET Quantity=$1, Price=$2, Amount=$3 WHERE OrderItemID=$4 RETURNING *",
      [quantity, price, amount, id]
    );
    if (result.rows.length === 0) return res.status(404).send("Order item not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating order item");
  }
};

// ✅ Delete an order item
const deleteOrderItem = async (req, res) => {
  const { id } = req.params; // OrderItemID
  try {
    const result = await pool.query("DELETE FROM OrderItems WHERE OrderItemID=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).send("Order item not found");
    res.json({ message: "Order item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting order item");
  }
};

module.exports = {
  getItemsByOrder,
  updateOrderItem,
  deleteOrderItem,
};
