const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    creating,
    getById,
    updated
} = require('./user.controller') 


// GET http://localhost:5000/users
router.get("",getAllUsers);

// POST http://localhost:5000/users
router.post("",creating);

router.get("/:id",getById);

router.put("/:id",updated);

module.exports = router;