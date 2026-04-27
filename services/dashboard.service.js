const Product = require('../model/Products');
const Order = require('../model/Order');
// const User = require('../model/User');
const Review = require('../model/Review');
const User = require('../model/Admin');
const Banner = require('../model/Banner');
const Category = require('../model/Category');
const Contactus = require('../model/Contactus'); // Assuming you have a Contactus model
const Customer = require('../model/User'); // Assuming you have a User model for customers

exports.getAdminDashboardDataService = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let [
        totalProducts,
        totalEnquiries,
        todayEnquiries,
        totalCustomers,
        last10Products,
        recentEnquiries,
        todaysReviews,
    ] = await Promise.all([
        Product.countDocuments(),
        Contactus.countDocuments(),
        Contactus.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
        Customer.countDocuments({ role: 'user' }), // adjust role name as per your system
        Product.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('category', 'category_name')
            .lean(),
        Contactus.find({ status: 'Show' })
            .sort({ createdAt: -1 })
            .lean(),
        Review.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).sort({ createdAt: -1 }).limit(10).populate("productId").populate('userId').lean(),

    ]);

    last10Products = last10Products.map(product => {
        const { category, ...rest } = product;
        return {
            category: category?.category_name || null,
            ...rest,
        };
    });

    recentEnquiries = recentEnquiries.map(enquiry => {
        const { user, ...rest } = enquiry;
        return {
            userName: user?.name || null,
            ...rest,
        };
    });




    return {
        stats: {
            totalProducts,
            totalEnquiries,
            todayEnquiries,
            totalCustomers
        },
        last10Products,
        recentEnquiries,
        todaysReviews,

    };
};

// exports.getDashboardDataService = async (adminUserId) => {
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     const todayEnd = new Date();
//     todayEnd.setHours(23, 59, 59, 999);

//     try {
//         const [
//             banners,
//             categories,
//             allProducts,
//             totalProductsCount,
//             totalEnquiriesCount,
//             todayEnquiriesCount,
//             totalCustomersCount,
//             last10Products,
//             recentEnquiries,
//             todaysReviews,
//             adminProfile
//         ] = await Promise.all([
//             Banner.find({}).sort({ createdAt: 1 }),
//             Category.find({ status: 'Show' }).sort({ createdAt: -1 }).populate('products'),
//             Product.find({ status: 'Show' })
//                 .sort({ createdAt: -1 })
//                 .limit(8)
//                 .populate('category metal_type rate purity'),
//             Product.countDocuments(),
//             Order.countDocuments(),
//             Order.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
//             User.countDocuments({ role: 'customer' }), // Assuming role is a field in User
//             Product.find({}).sort({ createdAt: -1 }).limit(10),
//             Order.find({}).sort({ createdAt: -1 }).limit(10),
//             Review.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
//             User.findById(adminUserId)
//         ]);

//         return {
//             banners,
//             categories,
//             products: allProducts,
//             stats: {
//                 totalProductsCount,
//                 totalEnquiriesCount,
//                 todayEnquiriesCount,
//                 totalCustomersCount,
//             },
//             last10Products,
//             recentEnquiries,
//             todaysReviews,
//             adminProfile,
//         };
//     } catch (error) {
//         throw error;
//     }
// };


exports.getDashboardDataService = async () => {
    // Banner.find({ status: 'Show' }).sort({ order: 1 }),
    try {
        // Fetch all data in parallel for better performance
        const [banners, categories, products] = await Promise.all([
            Banner.find({}).sort({ createdAt: 1 }),
            // Website should show only fine jewellery categories
            Category.find({ status: 'Show', jewellery_type: 'all_fine' })
                .sort({ createdAt: -1 })
                .populate('products'),
            Product.find({ status: 'Show' })
                .sort({ createdAt: -1 })
                .limit(8)
                .populate('category metal_type rate purity'),
        ]);

        // Filter out 9-carat products (based on category jewellery_type)
        const fineProducts = (products || []).filter((p) => {
            const jewelleryType = p?.category?.jewellery_type;
            return !jewelleryType || jewelleryType === 'all_fine';
        });

        return {
            banners,
            categories,
            products: fineProducts,
        };
    } catch (error) {
        throw error;
    }
};