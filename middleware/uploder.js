const multer = require("multer");
const path = require("path");
const { cloudinaryServices } = require("../services/cloudinary.service");

const storage = multer.memoryStorage();

const uploader = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const supportedImage = /png|jpg|jpeg|webp|gif/;
    const extension = path.extname(file.originalname).toLowerCase();

    if (supportedImage.test(extension)) {
      cb(null, true);
    } else {
      cb(new Error("Must be a png/jpg/jpeg/webp/gif image"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

const getFolderName = (req, file) => {
  let folder = "BMJEWELS";
  const fieldname = file ? file.fieldname : "";
  const path = req.originalUrl || req.url || "";

  if (fieldname === "category_image" || path.includes("/category")) {
    folder = "BMJEWELS/category";
  } else if (
    fieldname === "product_images" ||
    fieldname === "product_image" ||
    fieldname === "product" ||
    path.includes("/product")
  ) {
    folder = "BMJEWELS/product";
  } else if (fieldname === "banner_image" || path.includes("/banner")) {
    folder = "BMJEWELS/banner";
  }
  return folder;
};

const cloudinaryUpload = async (req, res, next) => {
  try {
    if (req.file) {
      const folder = getFolderName(req, req.file);
      const result = await cloudinaryServices.cloudinaryImageUpload(req.file.buffer, folder);
      req.file.filename = result.secure_url;
      req.file.path = result.secure_url;
    }
    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          const folder = getFolderName(req, file);
          const result = await cloudinaryServices.cloudinaryImageUpload(file.buffer, folder);
          file.filename = result.secure_url;
          file.path = result.secure_url;
        }
      } else {
        for (const field of Object.keys(req.files)) {
          for (const file of req.files[field]) {
            const folder = getFolderName(req, file);
            const result = await cloudinaryServices.cloudinaryImageUpload(file.buffer, folder);
            file.filename = result.secure_url;
            file.path = result.secure_url;
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error('Cloudinary upload error in middleware/uploder.js:', error);
    next(error);
  }
};

uploader.cloudinaryUpload = cloudinaryUpload;

module.exports = uploader;
