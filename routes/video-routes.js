const express = require("express");
const videoValidation = require("../middlewares/validators/video-validator");
const sharedValidator = require("../middlewares/validators/shared/index");
const videoController = require("../controllers/video-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.get(
    "/getAllVideos",
    sharedValidator.verifyHeaderAccessToken, 
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    videoController.getAllVideos
);

router.post(
    "/createVideo",
    videoValidation.createVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    videoController.createVideo
);

router.post(
    "/createMinimalVideo",
    videoValidation.createMinimalVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    videoController.createMinimalVideo
);

router.post(
    "/addTopicsInVideo",
    videoValidation.addTopicsInVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    videoController.addTopicsInVideo
);

router.delete(
    "/deleteVideo", 
    videoValidation.deleteVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    videoController.deleteVideo
);

router.get(
    "/getVideo", 
    videoValidation.getVideo,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER]),
    videoController.getVideo
);

router.put(
    "/updateVideo", 
    videoController.updateVideo
);

module.exports = router;
