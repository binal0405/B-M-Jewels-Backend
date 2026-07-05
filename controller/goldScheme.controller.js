const goldSchemeService = require("../services/goldScheme.service");

exports.createGoldScheme = async (req, res, next) => {
  try {
    const { full_name, email, mobile, password, scheme_name, hapta_paid } =
      req.body;

    if (!full_name || !email || !mobile || !password || !scheme_name) {
      return res.status(400).json({
        status: false,
        message:
          "Full name, email, mobile, password and scheme name are required",
      });
    }

    const result = await goldSchemeService.createGoldScheme({
      full_name,
      email,
      mobile,
      password,
      scheme_name,
      hapta_paid: Number(hapta_paid) || 0,
    });

    res.status(201).json({
      status: true,
      message: "Gold scheme customer added successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllGoldSchemes = async (req, res, next) => {
  try {
    const result = await goldSchemeService.getAllGoldSchemes();
    res.status(200).json({
      status: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getGoldSchemeById = async (req, res, next) => {
  try {
    const result = await goldSchemeService.getGoldSchemeById(req.params.id);
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Gold scheme not found",
      });
    }
    res.status(200).json({
      status: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyGoldSchemes = async (req, res, next) => {
  try {
    const result = await goldSchemeService.getGoldSchemeByUserId(req.user._id);
    res.status(200).json({
      status: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateGoldScheme = async (req, res, next) => {
  try {
    const { full_name, email, mobile, password, scheme_name, hapta_paid } =
      req.body;

    const result = await goldSchemeService.updateGoldScheme(req.params.id, {
      full_name,
      email,
      mobile,
      password,
      scheme_name,
      hapta_paid: hapta_paid !== undefined ? Number(hapta_paid) : undefined,
    });

    res.status(200).json({
      status: true,
      message: "Gold scheme updated successfully",
      data: result,
    });
  } catch (error) {
    if (error.message === "Gold scheme not found") {
      return res.status(404).json({ status: false, message: error.message });
    }
    if (error.message === "Email already exists for another customer") {
      return res.status(400).json({ status: false, message: error.message });
    }
    next(error);
  }
};

exports.deleteGoldScheme = async (req, res, next) => {
  try {
    const result = await goldSchemeService.deleteGoldScheme(req.params.id);
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Gold scheme not found",
      });
    }
    res.status(200).json({
      status: true,
      message: "Gold scheme deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
