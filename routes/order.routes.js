const express = require("express");
const {
  paymentIntent,
  addOrder,
  createRazorpayOrder,
  getOrders,
  updateOrderStatus,
  getSingleOrder,
} = require("../controller/order.controller");

// router
const router = express.Router();

// get orders
router.get("/orders", getOrders);
// single order
router.get("/:id", getSingleOrder);
// add a create payment intent
router.post("/create-payment-intent", paymentIntent);
// create razorpay order
router.post("/create-razorpay-order", createRazorpayOrder);
// save Order
router.post("/saveOrder", addOrder);
// update status
router.patch("/update-status/:id", updateOrderStatus);

module.exports = router;
