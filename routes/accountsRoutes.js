// accountsRoutes.js
const express = require("express");
const router = express.Router();
const accountsController = require("../controllers/accountsController");

router.get("/", accountsController.getAllAccounts);
router.get("/:id", accountsController.getAccountById);
router.post("/", accountsController.createAccount);
router.put("/:id", accountsController.updateAccount);
router.delete("/:id", accountsController.deleteAccount);
router.post("/:id/balance", accountsController.updateBalance); // credit/debit

module.exports = router;
