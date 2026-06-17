const express = require('express');
const router = express.Router();
const imageFeedController = require('../controller/imageFeed.controller');
const upload = require('../config/multerConfig');

router.post('/add', upload.single('feed_image'), upload.cloudinaryUpload, imageFeedController.addImageFeed);
router.get('/all', imageFeedController.getAllImageFeeds);
router.get('/get/:id', imageFeedController.getAImageFeed);
router.put('/update/:id', upload.single('feed_image'), upload.cloudinaryUpload, imageFeedController.updateImageFeed);
router.delete('/delete/:id', imageFeedController.deleteImageFeed);

router.get('/active', imageFeedController.getActiveImageFeeds);

module.exports = router;
