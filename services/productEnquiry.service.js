const ApiError = require('../errors/api-error');
const ProductEnquiry = require('../model/ProductEnquiry');

// create product enquiry
exports.createProductEnquiryService = async (data) => {
    try {
        return await ProductEnquiry.create(data);
    } catch (error) {
        throw error;
    }
};

// get all product enquiries
exports.getAllProductEnquiriesServices = async () => {
    const enquiries = await ProductEnquiry.find({}).sort({ createdAt: -1 });
    return enquiries;
};

// get single product enquiry
exports.getSingleProductEnquiryService = async (id) => {
    const result = await ProductEnquiry.findById(id);
    return result;
};

// delete product enquiry
exports.deleteProductEnquiryService = async (id) => {
    const result = await ProductEnquiry.findByIdAndDelete(id);
    return result;
};

// update product enquiry
exports.updateProductEnquiryService = async (id, payload) => {
    const isExist = await ProductEnquiry.findOne({ _id: id });

    if (!isExist) {
        throw new ApiError(404, 'Product enquiry not found!');
    }

    const result = await ProductEnquiry.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return result;
};
