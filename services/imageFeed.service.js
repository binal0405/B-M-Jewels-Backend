const ImageFeed = require('../model/ImageFeed');

exports.createImageFeedService = async (data) => {
    return await ImageFeed.create(data);
};

exports.getAllImageFeedsService = async () => {
    return await ImageFeed.find({}).sort({ order: 1, createdAt: -1 });
};

exports.getActiveImageFeedsService = async () => {
    return await ImageFeed.find({ status: 'Show' }).sort({ order: 1, createdAt: -1 });
};

exports.getSingleImageFeedService = async (id) => {
    return await ImageFeed.findById(id);
};

exports.updateImageFeedService = async (id, data) => {
    return await ImageFeed.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteImageFeedService = async (id) => {
    return await ImageFeed.findByIdAndDelete(id);
};
