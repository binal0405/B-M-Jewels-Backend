const productEnquiryServices = require("../services/productEnquiry.service.js");

exports.addProductEnquiry = async (req, res, next) => {
    try {
        const result = await productEnquiryServices.createProductEnquiryService(req.body);
        res.status(201).json({
            status: "success",
            message: "Product enquiry created successfully!",
            data: result,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.getAllProductEnquiries = async (req, res, next) => {
    try {
        const result = await productEnquiryServices.getAllProductEnquiriesServices();
        res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        next(error);
    }
};

exports.getSingleProductEnquiry = async (req, res, next) => {
    try {
        const result = await productEnquiryServices.getSingleProductEnquiryService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteProductEnquiry = async (req, res, next) => {
    try {
        const result = await productEnquiryServices.deleteProductEnquiryService(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Product enquiry deleted successfully',
            result,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProductEnquiry = async (req, res, next) => {
    try {
        const result = await productEnquiryServices.updateProductEnquiryService(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            message: 'Product enquiry updated successfully',
            result,
        });
    } catch (error) {
        next(error);
    }
};
