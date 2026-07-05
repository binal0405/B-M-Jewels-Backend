const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware.js");
const router = express.Router();
const upload = require("../config/multerConfig");

// Internal
const productController = require("../controller/product.controller.js");
const categoryController = require('../controller/category.controller');

// Call the categoryController function when querying by category
router.get('/', categoryController.getProductTypeCategory);

// 🔹 Product Fetching Routes
router.get("/all", productController.getAllProducts);

// Add these to your product routes
router.get('/search', productController.searchProducts);
router.get('/web/search', productController.searchWebProducts);


router.get("/web", productController.getAllProductsWeb);
router.get("/offer", productController.getOfferTimerProducts);
router.get("/top-rated", productController.getTopRatedProducts);
router.get("/review-product/:productId", productController.reviewProducts);
router.get("/popular", productController.getPopularProductByType);
// router.get("/related-product", productController.getRelatedProducts);
router.get("/related-product/:id", productController.getRelatedProducts);
router.get("/show/:id", productController.getSingleProduct);
router.get("/web/:id", productController.getSingleWebProduct);
router.get("/stock-out", productController.stockOutProducts);
// router.get("/", productController.getProductsByType);

// 🔹 Product Modification Routes
router.post("/add", protect, adminOnly, upload.array("product_images", 5), upload.cloudinaryUpload, productController.addProduct);
router.post("/add-all", protect, adminOnly, productController.addAllProducts);
router.put("/edit/:id", upload.array("product_images", 5), upload.cloudinaryUpload, productController.updateProduct);
router.delete("/delete/:id", protect, adminOnly, productController.deleteProduct); // Use route parameter instead of body

module.exports = router;
