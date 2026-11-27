require('dotenv').config();

const connectDB = require('./config/db');

const Brand = require('./model/Brand');
const brandData = require('./utils/brands');

const Category = require('./model/Category');
const categoryData = require('./utils/categories');

const Products = require('./model/Products');
const productsData = require('./utils/products');

const Coupon = require('./model/Coupon');
const couponData = require('./utils/coupons');

const Order = require('./model/Order');
const orderData = require('./utils/orders');

const User = require('./model/User');
const userData = require('./utils/users');

const Reviews = require('./model/Review');
const reviewsData = require('./utils/reviews');

const Admin = require('./model/Admin');
const adminData = require('./utils/admin');

connectDB();
const importData = async () => {
  try {
    const allowWipe = process.env.ALLOW_SEED_WIPE === 'true';

    const adminCount = await Admin.countDocuments();
    if (adminCount === 0 || allowWipe) {
      if (allowWipe) await Admin.deleteMany();
      await Admin.insertMany(adminData);
      console.log('Admin data seeded!');
    } else {
      console.log(`Skipping Admin seed — ${adminCount} admins already exist. (Set ALLOW_SEED_WIPE=true to overwrite)`);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0 || allowWipe) {
      if (allowWipe) await User.deleteMany();
      await User.insertMany(userData);
      console.log('User data seeded!');
    } else {
      console.log(`Skipping User seed — ${userCount} users already exist.`);
    }

    if (allowWipe) {
      await Brand.deleteMany();
      await Brand.insertMany(brandData);

      await Category.deleteMany();
      await Category.insertMany(categoryData);

      await Products.deleteMany();
      await Products.insertMany(productsData);

      await Coupon.deleteMany();
      await Coupon.insertMany(couponData);

      await Order.deleteMany();
      await Order.insertMany(orderData);

      await Reviews.deleteMany();
      await Reviews.insertMany(reviewsData);
    } else {
      if ((await Brand.countDocuments()) === 0) await Brand.insertMany(brandData);
      if ((await Category.countDocuments()) === 0) await Category.insertMany(categoryData);
      if ((await Products.countDocuments()) === 0) await Products.insertMany(productsData);
      if ((await Coupon.countDocuments()) === 0) await Coupon.insertMany(couponData);
      if ((await Order.countDocuments()) === 0) await Order.insertMany(orderData);
      if ((await Reviews.countDocuments()) === 0) await Reviews.insertMany(reviewsData);
    }

    console.log('Data import check completed successfully!');
    process.exit();
  } catch (error) {
    console.log('error', error);
    process.exit(1);
  }
};

importData();
