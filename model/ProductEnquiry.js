const mongoose = require('mongoose');

const ProductEnquirySchema = mongoose.Schema({
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
    product_name: {
        type: String,
        required: true,
    },
    design_code: {
        type: String,
        required: false,
    },
    img: {
        type: String,
        required: false,
    },
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false,
    },
    url: {
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

const ProductEnquiry = mongoose.model('ProductEnquiry', ProductEnquirySchema);
module.exports = ProductEnquiry;
