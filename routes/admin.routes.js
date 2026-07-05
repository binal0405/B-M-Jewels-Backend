const express = require("express");
const router = express.Router();
const { body } = require("express-validator")
// const { logoutAdmin } = require("../config/auth");
const { isAuth } = require("../middleware/authMiddleware");
const bcrypt = require("bcryptjs");

const upload = require('../config/multerConfig');


const {
  registerAdmin,
  loginAdmin,
  updateStaff,
  changePassword,
  addStaff,
  getAllStaff,
  logoutAdmin,
  deleteStaff,
  getStaffById,
  getAdminProfile,
  updateAdminProfile,
  forgetPassword,
  confirmAdminEmail,
  confirmAdminForgetPass,
} = require("../controller/admin.controller");

//register a staff
router.post("/register", registerAdmin);

router.post('/login', [
  body('email').isEmail().withMessage('Invalid Email'),
  // body('firstname').isLength({ min: 1 }).withMessage('First name must be at least 3 characters long'),
  body('password').isLength({ min: 1 }).withMessage('Password must be at least 6 characters long'),
  // body('mobile').isLength({ min: 10 }).withMessage('Mobile Number must be at least 10 Digits long')
],
  loginAdmin
)
//login a admin
// router.post("/login", loginAdmin);

//login a admin
router.patch("/change-password", changePassword);


router.post("/logout", logoutAdmin);

//login a admin
router.post("/add", addStaff);

//login a admin
router.get("/all", getAllStaff);

//forget-password
router.patch("/forget-password", forgetPassword);

//forget-password
router.patch("/confirm-forget-password", confirmAdminForgetPass);

//get a staff
router.get("/get/:id", getStaffById);

// update a staff
router.patch("/update-stuff/:id", updateStaff);

//update staf status
// router.put("/update-status/:id", updatedStatus);

//delete a staff
router.delete("/:id", deleteStaff);

// Routes
router.get('/profile/:id', getAdminProfile);
router.put('/profile/:id', upload.single('image'), upload.cloudinaryUpload, updateAdminProfile);


// routeer.get("/admin", getAdmin);

module.exports = router;
