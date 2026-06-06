const express = require('express');
const router = express.Router();
const bannerController = require('../controller/banner.controller');
const upload = require('../config/multerConfig');

// Admin routes
router.post('/add', upload.single('banner_image'), upload.cloudinaryUpload, bannerController.addBanner);
router.get('/all', bannerController.getAllBanners);
router.get('/get/:id', bannerController.getABanner);
router.put('/update/:id', upload.single('banner_image'), upload.cloudinaryUpload, bannerController.updateBanner);
router.delete('/delete/:id', bannerController.deleteBanner);

// Frontend route (active banners)
router.get('/active', bannerController.getActiveBanners);

module.exports = router;