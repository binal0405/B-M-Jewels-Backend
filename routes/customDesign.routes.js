const express = require('express');
const router = express.Router();
// internal
const customDesignController = require('../controller/customDesign.controller.js');
const upload = require('../config/multerConfig');

// add - allows uploading up to 3 files under the field name 'images'
router.post('/add', upload.array('images', 3), upload.cloudinaryUpload, customDesignController.addCustomDesign);

// get all
router.get('/all', customDesignController.getAllCustomDesigns);

// get single by id
router.get('/get/:id', customDesignController.getSingleCustomDesign);

// delete by id
router.delete('/:id', customDesignController.deleteCustomDesign);

// update status/details
router.put('/edit/:id', customDesignController.updateCustomDesign);

module.exports = router;
