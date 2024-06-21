const express = require("express");
const resourceValidation = require("../middlewares/validators/resource-validator");
const resourceController = require("../controllers/resource-controller");
const roleBasedAccess = require("../middlewares/rbac/index")
const ROLES = require("../models/roles/index")

const router = express.Router();

router.post(
    "/createResource",
    resourceValidation.createResource,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.createResource
);

router.delete(
    "/deleteResource",
    resourceValidation.deleteResource,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.deleteResource
);

router.get(
    "/getResources",
    resourceValidation.getResources,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.getResources
);

router.get(
    "/getResource",
    resourceValidation.getResource,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    resourceController.getResource
);

router.get(
    "/getResourcesCount",
    resourceValidation.getResourceCount,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.getResourcesCount
    );

router.post(
    "/updateResource",
    resourceValidation.updateResource,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.updateResource
);

router.get(
    "/getResourcesByType",
    resourceValidation.getResourcesByType,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.getResourcesByType
);

router.get(
    "/getResourcesByName",
    resourceValidation.getResourcesByName,
    roleBasedAccess.setUser,
    roleBasedAccess.VerifyAllowedRole([ROLES.ADMIN]),
    resourceController.getResourcesByName
);

module.exports = router;
