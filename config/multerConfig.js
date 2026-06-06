// config/multerConfig.js
const multer = require('multer');
const path = require('path');
const { cloudinaryServices } = require('../services/cloudinary.service');

const storage = multer.memoryStorage();

// Initialize upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, gif, webp) are allowed!'));
    },
});

const cloudinaryUpload = async (req, res, next) => {
    try {
        if (req.file) {
            const result = await cloudinaryServices.cloudinaryImageUpload(req.file.buffer);
            req.file.filename = result.secure_url;
            req.file.path = result.secure_url;
        }
        if (req.files) {
            if (Array.isArray(req.files)) {
                for (const file of req.files) {
                    const result = await cloudinaryServices.cloudinaryImageUpload(file.buffer);
                    file.filename = result.secure_url;
                    file.path = result.secure_url;
                }
            } else {
                for (const field of Object.keys(req.files)) {
                    for (const file of req.files[field]) {
                        const result = await cloudinaryServices.cloudinaryImageUpload(file.buffer);
                        file.filename = result.secure_url;
                        file.path = result.secure_url;
                    }
                }
            }
        }
        next();
    } catch (error) {
        console.error('Cloudinary upload error in config/multerConfig.js middleware:', error);
        next(error);
    }
};

upload.cloudinaryUpload = cloudinaryUpload;

module.exports = upload;