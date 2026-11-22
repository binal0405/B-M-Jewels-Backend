const express = require("express");
const router = express.Router();
const {
  getShippingQuote,
  createShipmentForOrder,
  trackShipment,
  trackOrderShipment,
  getDhlConfig,
} = require("../controller/dhl.controller");

// Calculate rate quote with remote area surcharge (RAS)
router.post("/quote", getShippingQuote);

// Create DHL CSB-V shipment for an order
router.post("/create-shipment/:orderId", createShipmentForOrder);

// Track DHL AWB directly
router.get("/track/:awbNumber", trackShipment);

// Track order's DHL shipment
router.get("/order-track/:orderId", trackOrderShipment);

// Get current DHL config summary
router.get("/config", getDhlConfig);

module.exports = router;
