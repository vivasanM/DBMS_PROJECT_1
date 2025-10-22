const express = require("express");
const router = express.Router();
const orderItemsController = require("../controllers/orderItemsController");

router.get("/:orderId", orderItemsController.getItemsByOrder);
router.put("/:id", orderItemsController.updateOrderItem);
router.delete("/:id", orderItemsController.deleteOrderItem);

module.exports = router;
