const express = require('express');
const router = express.Router();

// internal
const productEnquiryController = require('../controller/productEnquiry.controller.js');

// add
router.post('/add', productEnquiryController.addProductEnquiry);

// get all
router.get('/all', productEnquiryController.getAllProductEnquiries);

// get single by id
router.get('/get/:id', productEnquiryController.getSingleProductEnquiry);

// delete by id
router.delete('/:id', productEnquiryController.deleteProductEnquiry);

// update status/details
router.put('/edit/:id', productEnquiryController.updateProductEnquiry);

module.exports = router;
