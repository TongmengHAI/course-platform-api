const express = require("express");
const router = express.Router();

const {
    register,
    login,
    refresh,
    logout
} = require('./auth.controller');
const { auth } = require("../../middlewares/auth");

// prefix "/auth" comes from server.js
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", auth, logout);


module.exports = router;
