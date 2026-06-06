const ApiError = require('../errors/api-error');
const CustomDesign = require('../model/CustomDesign');

// create custom design service
exports.createCustomDesignService = async (data) => {
    try {
        return await CustomDesign.create(data);
    } catch (error) {
        throw error;
    }
};

// get all show custom design services (where admin_status is 'Show')
exports.getShowCustomDesignsServices = async () => {
    const customDesigns = await CustomDesign.find({ admin_status: 'Show' }).sort({ createdAt: -1 });
    return customDesigns;
};

// get all custom design services
exports.getAllCustomDesignsServices = async () => {
    const customDesigns = await CustomDesign.find({}).sort({ createdAt: -1 });
    return customDesigns;
};

// delete custom design service
exports.deleteCustomDesignService = async (id) => {
    const result = await CustomDesign.findByIdAndDelete(id);
    return result;
};

// update custom design
exports.updateCustomDesignService = async (id, payload) => {
    const isExist = await CustomDesign.findOne({ _id: id });

    if (!isExist) {
        throw new ApiError(404, 'Custom design enquiry not found!');
    }

    const result = await CustomDesign.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return result;
};

// get single custom design
exports.getSingleCustomDesignService = async (id) => {
    const result = await CustomDesign.findById(id);
    return result;
};
