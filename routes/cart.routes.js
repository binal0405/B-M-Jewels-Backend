const express = require("express");
const router = express.Router();
const cartController = require("../controller/cart.controller");
const verifyToken = require("../middleware/verifyToken");

// Get user's cart (requires login)
router.get("/", verifyToken, cartController.getCart);

// Sync user's cart (requires login)
router.post("/sync", verifyToken, cartController.syncCart);

module.exports = router;
