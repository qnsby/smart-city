const { Router } = require("express");
const authController = require("../controllers/auth");
const { authRequired } = require("../middleware/auth");
const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.get("/me", authRequired, authController.me);

module.exports = { authRouter: router };
