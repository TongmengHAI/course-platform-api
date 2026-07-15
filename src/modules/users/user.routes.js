const express = require("express");
const router = express.Router();

const {
    getAllUsers,
    createUser,
    getUserById,
    getUserByEmail,
    updateUser,
    softDeleteUser
} = require('./user.controller') 


// GET http://localhost:5000/users
router.get("",getAllUsers);

// POST http://localhost:5000/users
router.post("",createUser);

router.get("/getByEmail", getUserByEmail);

router.get("/:id",getUserById);

router.put("/:id",updateUser);

router.delete("/:id",softDeleteUser);

module.exports = router;