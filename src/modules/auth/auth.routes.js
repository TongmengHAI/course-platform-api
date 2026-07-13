const express = require("express");
const {
    register,
    login
} = require("./auth.controller");

const router = express.Router();

// The route file only defines the last part of the URL.
// The prefix "/api/auth" comes from server.js.
router.post("/register", register); // POST http://localhost:5000/api/auth/register
router.post("/login", login);       // POST http://localhost:5000/api/auth/login

module.exports = router;
