const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware.js");
const settingController = require('../controller/setting.controller');
// const upload = require('../middlewares/upload')('settings', 'setting');
const upload = require("../config/multerConfig");

// For internal use (you only)
router.post('/create', upload.single('value'), upload.cloudinaryUpload, settingController.createSetting);
router.delete('/:id', settingController.deleteSetting);

// For admin panel frontend
router.get('/', settingController.getAllSettings);
// router.put('/update-values', upload.single('value'),settingController.updateSettingsByIds);
router.put('/update-values', protect, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'bank_logo', maxCount: 1 }
]), upload.cloudinaryUpload, settingController.updateSettingsByNames);
module.exports = router;
