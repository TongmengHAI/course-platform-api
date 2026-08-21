const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../../middlewares/auth"); // ⬅️ Import auth and authorize

// Import the controllers
const {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    softDeleteCourse
} = require("./courses.controller");

// Read endpoints - open to the public (no token required)
router.get("", getAllCourses);          // GET    /courses
router.get("/:id", getCourseById);      // GET    /courses/:id

// Write/Mutation endpoints - strictly restricted to authenticated instructors and admins
router.post("", auth, authorize("instructor", "admin"), createCourse);          // POST   /courses
router.put("/:id", auth, authorize("instructor", "admin"), updateCourse);       // PUT    /courses/:id
router.delete("/:id", auth, authorize("instructor", "admin"), deleteCourse);    // DELETE /courses/:id
router.patch("/:id", auth, authorize("instructor", "admin"), softDeleteCourse); // PATCH  /courses/:id

module.exports = router;