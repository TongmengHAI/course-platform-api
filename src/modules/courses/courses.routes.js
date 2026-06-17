const express = require("express");
const router = express.Router();

// Import the controllers
const {
    getAllCourses,
    getCourseById
} = require("./courses.controller");

// Map endpoints to controller functions
router.get("", getAllCourses);  // http:://127.0.0.1:5000/courses/


router.get("/:id/get", getCourseById);  // http:://127.0.0.1:5000/courses/1

module.exports = router;

