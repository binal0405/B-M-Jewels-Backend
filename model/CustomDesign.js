const mongoose = require('mongoose');

const CustomDesignSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    remarks: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        enum: ['Submitted', 'Contacted', 'In Progress', 'Resolved'],
        default: 'Submitted',
    },
    admin_status: {
        type: String,
        enum: ['Show', 'Hide'],
        default: 'Show',
    },
}, {
    timestamps: true
});

const CustomDesign = mongoose.model('CustomDesign', CustomDesignSchema);
module.exports = CustomDesign;
