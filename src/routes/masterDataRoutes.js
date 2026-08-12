const express = require("express");
const router = express.Router();
const masterDataController = require("../controllers/masterDataController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/common-programs", authMiddleware, masterDataController.getCommonPrograms);
router.get("/locations", authMiddleware, masterDataController.getLocations);

module.exports = router;
