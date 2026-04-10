const { Router } = require("express");
const userController = require("../controllers/user");
const { authRequired } = require("../middleware/auth");

const router = Router();

router.get("/me", authRequired, userController.me);
router.patch("/me", authRequired, userController.updateMe);

module.exports = { userRouter: router };