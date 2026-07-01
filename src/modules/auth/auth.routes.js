const express = require("express");
const router = express.Router();

const {
    register,
    login
} = require('./auth.controller');

// prefix "/auth" comes from server.js
// POST http://localhost:5000/auth/register
router.post("/register", register);
// POST http://localhost:5000/auth/login
router.post("/login", login);

module.exports = router;
