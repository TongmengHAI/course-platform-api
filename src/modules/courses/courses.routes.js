const express = require("express");
const router = express.Router();

// Import the controllers
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    softDeleteCourse
} = require("./courses.controller");

// CRUD = Create, Read, Update, Delete

// Map endpoints to controller functions
router.get("", getAllCourses);          // GET    http://127.0.0.1:5000/courses/
router.post("", createCourse);          // POST   http://127.0.0.1:5000/courses/

router.get("/:id", getCourseById);      // GET    http://127.0.0.1:5000/courses/1


router.put("/:id", updateCourse);       // PUT    http://127.0.0.1:5000/courses/1


router.delete("/:id", deleteCourse);    // DELETE http://127.0.0.1:5000/courses/1
router.patch("/:id", softDeleteCourse); // PATCH http://127.0.0.1:5000/courses/1

module.exports = router;
