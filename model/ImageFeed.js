const mongoose = require('mongoose');

const ImageFeedSchema = new mongoose.Schema({
    feed_image: {
        type: String,
        required: true,
    },
    link: {
        type: String,
        required: true,
        default: '',
    },
    status: {
        type: String,
        enum: ['Show', 'Hide'],
        default: 'Show',
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('ImageFeed', ImageFeedSchema);
