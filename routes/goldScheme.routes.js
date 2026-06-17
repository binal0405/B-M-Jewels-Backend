const express = require("express");
const router = express.Router();
const { isAuth } = require("../middleware/authMiddleware");
const verifyToken = require("../middleware/verifyToken");
const goldSchemeController = require("../controller/goldScheme.controller");

router.get("/my", verifyToken, goldSchemeController.getMyGoldSchemes);
router.get("/", isAuth, goldSchemeController.getAllGoldSchemes);
router.get("/:id", isAuth, goldSchemeController.getGoldSchemeById);
router.post("/", isAuth, goldSchemeController.createGoldScheme);
router.put("/:id", isAuth, goldSchemeController.updateGoldScheme);
router.delete("/:id", isAuth, goldSchemeController.deleteGoldScheme);

module.exports = router;
