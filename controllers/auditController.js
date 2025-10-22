const pool = require("../db");

// Get all audit logs
async function getAllAuditLogs(req, res) {
  try {
    const result = await pool.query("SELECT * FROM Audit_Log ORDER BY ChangedAt DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

// Get audit log by ID
async function getAuditLogById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM Audit_Log WHERE LogID=$1", [id]);
    if (result.rows.length === 0) return res.status(404).send("Audit log not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
}

module.exports = {
  getAllAuditLogs,
  getAuditLogById,
};
