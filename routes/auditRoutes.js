const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

router.get("/", auditController.getAllAuditLogs);
router.get("/:id", auditController.getAuditLogById);

module.exports = router;
