const customDesignServices = require("../services/customDesign.service.js");

exports.addCustomDesign = async (req, res, next) => {
    try {
        const imageUrls = [];
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach(file => {
                if (file.path) imageUrls.push(file.path);
            });
        }
        
        const customDesignData = {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            remarks: req.body.remarks,
            images: imageUrls,
            status: req.body.status || 'Submitted',
            admin_status: req.body.admin_status || 'Show'
        };

        const result = await customDesignServices.createCustomDesignService(customDesignData);
        res.status(201).json({
            status: "success",
            message: "Custom design enquiry created successfully!",
            data: result,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

exports.getAllCustomDesigns = async (req, res, next) => {
    try {
        const result = await customDesignServices.getAllCustomDesignsServices();
        res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        next(error);
    }
};

exports.getSingleCustomDesign = async (req, res, next) => {
    try {
        const result = await customDesignServices.getSingleCustomDesignService(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteCustomDesign = async (req, res, next) => {
    try {
        const result = await customDesignServices.deleteCustomDesignService(req.params.id);
        res.status(200).json({
            success: true,
            message: 'Custom design enquiry deleted successfully',
            result,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateCustomDesign = async (req, res, next) => {
    try {
        const result = await customDesignServices.updateCustomDesignService(req.params.id, req.body);
        res.status(200).json({
            status: 'success',
            message: 'Custom design enquiry updated successfully',
            result,
        });
    } catch (error) {
        next(error);
    }
};
