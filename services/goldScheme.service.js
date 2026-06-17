const GoldScheme = require("../model/GoldScheme");
const User = require("../model/User");

const findOrCreateUser = async ({ full_name, email, mobile, password }) => {
  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    user.name = full_name;
    user.phone = mobile;
    if (password) {
      user.password = password;
    }
    await user.save();
    return user;
  }

  user = await User.create({
    name: full_name,
    email: email.toLowerCase(),
    phone: mobile,
    password,
    status: "active",
  });

  return user;
};

exports.createGoldScheme = async (data) => {
  const user = await findOrCreateUser(data);

  const scheme = await GoldScheme.create({
    user: user._id,
    full_name: data.full_name,
    email: data.email.toLowerCase(),
    mobile: data.mobile,
    scheme_name: data.scheme_name,
    hapta_paid: data.hapta_paid,
  });

  return scheme.populate("user", "-password");
};

exports.getAllGoldSchemes = async () =>
  GoldScheme.find().populate("user", "-password").sort({ createdAt: -1 });

exports.getGoldSchemeById = async (id) =>
  GoldScheme.findById(id).populate("user", "-password");

exports.getGoldSchemeByUserId = async (userId) =>
  GoldScheme.find({ user: userId }).sort({ createdAt: -1 });

exports.updateGoldScheme = async (id, data) => {
  const scheme = await GoldScheme.findById(id);
  if (!scheme) {
    throw new Error("Gold scheme not found");
  }

  const user = await User.findById(scheme.user);
  if (!user) {
    throw new Error("Linked user not found");
  }

  if (data.email && data.email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing && existing._id.toString() !== user._id.toString()) {
      throw new Error("Email already exists for another customer");
    }
  }

  user.name = data.full_name ?? user.name;
  user.email = (data.email ?? user.email).toLowerCase();
  user.phone = data.mobile ?? user.phone;
  if (data.password) {
    user.password = data.password;
  }
  await user.save();

  scheme.full_name = data.full_name ?? scheme.full_name;
  scheme.email = (data.email ?? scheme.email).toLowerCase();
  scheme.mobile = data.mobile ?? scheme.mobile;
  scheme.scheme_name = data.scheme_name ?? scheme.scheme_name;
  scheme.hapta_paid =
    data.hapta_paid !== undefined ? data.hapta_paid : scheme.hapta_paid;

  await scheme.save();
  return scheme.populate("user", "-password");
};

exports.deleteGoldScheme = async (id) => GoldScheme.findByIdAndDelete(id);
