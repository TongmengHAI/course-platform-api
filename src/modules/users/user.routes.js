const express = require("express");
const router = express.Router();

const {
    listing,
    creating,
    getById
} = require('./user.controller')


// GET http://localhost:5000/users
router.get("",listing);

// POST http://localhost:5000/users
router.post("",creating);

router.get("/:id",getById);

module.exports = router;