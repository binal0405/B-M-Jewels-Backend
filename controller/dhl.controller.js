const Order = require("../model/Order");
const dhlService = require("../services/dhl.service");
const { secret } = require("../config/secret");

/**
 * 1. Get DHL Shipping Quote (Remote Area Surcharge + Freight)
 */
exports.getShippingQuote = async (req, res, next) => {
  try {
    const result = await dhlService.quoteShipment(req.body);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("DHL quote error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate DHL shipping quote",
    });
  }
};

/**
 * 2. Book DHL CSB-V Shipment for an Order
 */
exports.createShipmentForOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Call DHL CSB-V shipment creation service
    const shipmentResult = await dhlService.createShipmentCSBV(order, req.body || {});

    if (!shipmentResult.success) {
      return res.status(400).json({
        success: false,
        message: shipmentResult.message || "Failed to book DHL shipment",
        rawResponse: shipmentResult.rawResponse,
      });
    }

    // Save DHL information to the order
    order.dhlAwbNumber = shipmentResult.awbNumber;
    order.dhlLabelUrl = shipmentResult.labelUrl;
    order.dhlInvoiceUrl = shipmentResult.invoiceUrl;
    order.dhlPieceBarcode = shipmentResult.pieceBarcode;
    order.dhlShipmentStatus = "Shipment Created";
    order.status = "dispatched";
    order.dhlBookingDetails = shipmentResult;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "DHL Express shipment created successfully!",
      data: {
        awbNumber: shipmentResult.awbNumber,
        labelUrl: shipmentResult.labelUrl,
        invoiceUrl: shipmentResult.invoiceUrl,
        pieceBarcode: shipmentResult.pieceBarcode,
      },
      order,
    });
  } catch (error) {
    console.error("DHL create shipment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create DHL shipment",
    });
  }
};

/**
 * 3. Track DHL AWB Number directly
 */
exports.trackShipment = async (req, res, next) => {
  try {
    const awbNumber = req.params.awbNumber || req.query.awb;
    if (!awbNumber) {
      return res.status(400).json({
        success: false,
        message: "AWB Number is required",
      });
    }

    const result = await dhlService.trackShipmentAllCheckpoints(awbNumber);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("DHL track error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to track DHL shipment",
    });
  }
};

/**
 * 4. Track Order Shipment
 */
exports.trackOrderShipment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.dhlAwbNumber) {
      return res.status(400).json({
        success: false,
        message: "This order has not been dispatched via DHL yet.",
      });
    }

    const trackingResult = await dhlService.trackShipmentAllCheckpoints(order.dhlAwbNumber);

    if (trackingResult.checkpoints && trackingResult.checkpoints.length > 0) {
      order.dhlTrackingEvents = trackingResult.checkpoints;
      order.dhlShipmentStatus = trackingResult.status || order.dhlShipmentStatus;
      await order.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        invoice: order.invoice,
        awbNumber: order.dhlAwbNumber,
        labelUrl: order.dhlLabelUrl,
        invoiceUrl: order.dhlInvoiceUrl,
        status: trackingResult.status || order.dhlShipmentStatus || "Shipment Created",
        checkpoints: trackingResult.checkpoints || [],
      },
    });
  } catch (error) {
    console.error("DHL order track error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to track order DHL shipment",
    });
  }
};

/**
 * 5. Get DHL Configuration Summary
 */
exports.getDhlConfig = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        serviceUrl: secret.dhl_service_url,
        accountNumber: secret.dhl_account_number,
        companyName: secret.dhl_company_name,
        contactName: secret.dhl_contact_name,
        contactEmail: secret.dhl_contact_email,
        contactNumber: secret.dhl_contact_number,
        shipperCity: secret.dhl_shipper_city,
        shipperState: secret.dhl_shipper_state,
        shipperPostalCode: secret.dhl_shipper_postal_code,
        iecNo: secret.dhl_iec_no,
        gstin: secret.dhl_gstin,
        defaultHsn: secret.dhl_default_hsn,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
