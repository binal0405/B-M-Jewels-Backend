const imageFeedService = require('../services/imageFeed.service');

const formatImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    return `${process.env.ADMIN_URL}${imagePath}`;
};

exports.addImageFeed = async (req, res, next) => {
    try {
        if (!req.file || !req.body.link) {
            return res.status(400).json({
                success: false,
                message: 'Image and link are required!',
            });
        }

        const data = {
            feed_image: (req.file.filename.startsWith('http://') || req.file.filename.startsWith('https://'))
                ? req.file.filename
                : 'images/' + req.file.filename,
            link: req.body.link,
            status: req.body.status || 'Show',
            order: req.body.order || 0,
        };

        const result = await imageFeedService.createImageFeedService(data);
        res.status(201).json({
            success: true,
            message: 'Image feed item created successfully!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllImageFeeds = async (req, res, next) => {
    try {
        const items = await imageFeedService.getAllImageFeedsService();
        const formatted = items.map((item) => ({
            ...item.toObject(),
            feed_image: formatImageUrl(item.feed_image),
        }));
        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

exports.getAImageFeed = async (req, res, next) => {
    try {
        const item = await imageFeedService.getSingleImageFeedService(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Image feed item not found',
            });
        }
        res.status(200).json({
            success: true,
            data: {
                ...item.toObject(),
                feed_image: formatImageUrl(item.feed_image),
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.getActiveImageFeeds = async (req, res, next) => {
    try {
        const items = await imageFeedService.getActiveImageFeedsService();
        const formatted = items.map((item) => ({
            ...item.toObject(),
            feed_image: formatImageUrl(item.feed_image),
        }));
        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        next(error);
    }
};

exports.updateImageFeed = async (req, res, next) => {
    try {
        const data = { ...req.body };
        if (req.file) {
            data.feed_image = (req.file.filename.startsWith('http://') || req.file.filename.startsWith('https://'))
                ? req.file.filename
                : 'images/' + req.file.filename;
        }
        const result = await imageFeedService.updateImageFeedService(req.params.id, data);
        res.status(200).json({
            success: true,
            message: 'Image feed item updated successfully!',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteImageFeed = async (req, res, next) => {
    try {
        await imageFeedService.deleteImageFeedService(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Image feed item deleted successfully!',
        });
    } catch (error) {
        next(error);
    }
};
