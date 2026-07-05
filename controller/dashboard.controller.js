const dashboardService = require('../services/dashboard.service');
const { resolvePublicImageUrl } = require('../utils/multer-public-path');

exports.getDashboardData = async (req, res, next) => {
    try {
        const adminUserId = req.user?._id || null; // Assuming you're using auth middleware

        const data = await dashboardService.getDashboardDataService(adminUserId);
        const formattedData = {
            banners: data.banners.map(banner => ({
                ...banner.toObject(),
                banner_image: resolvePublicImageUrl(banner.banner_image),
            })),
            categories: data.categories.map(category => ({
                ...category.toObject(),
                category_image: resolvePublicImageUrl(category.category_image),
                productCount: category.products.length,
            })),
            nineCaratCategories: data.nineCaratCategories.map(category => ({
                ...category.toObject(),
                category_image: resolvePublicImageUrl(category.category_image),
            })),
            products: data.products.map(product => ({
                ...product.toObject(),
                product_images: product.product_images.map((img) => resolvePublicImageUrl(img)),
                category: product.category ? {
                    _id: product.category._id,
                    category_name: product.category.category_name,
                    category_image: resolvePublicImageUrl(product.category.category_image),
                } : null,
            })),
            stats: data.stats,
            last10Products: data.last10Products,
            recentEnquiries: data.recentEnquiries,
            todaysReviews: data.todaysReviews,
            profile: {
                name: data.adminProfile?.name || '',
                email: data.adminProfile?.email || '',
                profile_image: resolvePublicImageUrl(data.adminProfile?.profile_image),
            }
        };

        res.status(200).json({
            status: true,
            message: "Dashboard data fetched successfully",
            data: formattedData,
        });
    } catch (error) {
        next(error);
    }
};


// exports.getDashboardData = async (req, res, next) => {
//     try {
//         const data = await dashboardService.getDashboardDataService();

//         // Format the response (add full URLs for images)
//         const formattedData = {
//             banners: data.banners.map(banner => ({
//                 ...banner.toObject(),
//                 banner_image: banner.banner_image ? `${process.env.ADMIN_URL}${banner.banner_image}` : null,
//             })),
//             categories: data.categories.map(category => ({
//                 ...category.toObject(),
//                 category_image: category.category_image ? `${process.env.ADMIN_URL}${category.category_image}` : null,
//                 productCount: category.products.length, // Optional: Include product count
//             })),
//             products: data.products.map(product => ({
//                 ...product.toObject(),
//                 product_images: product.product_images.map(img => `${process.env.ADMIN_URL}${img}`),
//                 category: product.category ? {
//                     _id: product.category._id,
//                     category_name: product.category.category_name,
//                     category_image: product.category.category_image ? `${process.env.ADMIN_URL}${product.category.category_image}` : null,
//                 } : null,
//             })),
//         };

//         res.status(200).json({
//             status: true,
//             message: "Dashboard data fetched successfully",
//             data: formattedData,
//         });
//     } catch (error) {
//         next(error);
//     }
// };



// ✅ New: Admin Dashboard Controller
exports.getAdminDashboardData = async (req, res, next) => {
    try {
        // const adminUserId = req.params.id;
        const dashboardData = await dashboardService.getAdminDashboardDataService();

        res.status(200).json({
            status: true,
            message: "Admin dashboard data fetched successfully",
            data: dashboardData,
        });
    } catch (error) {
        next(error);
    }
};