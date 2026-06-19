const courses = require("./courses.data");


// @desc Get all courses
// @route GET /
const getAllCourses = (req, res) => {
    res.json({ message: "Courses retrieved successfully", data: courses });
};


// @desc Get single course by ID
// @route GET /:id
const getCourseById = (req, res) => {
    const courseId = Number(req.params.id);
    const course = courses.find((item) => item.id === courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json({ message: "Course retrieved successfully", data: course });
};
module.exports = { getAllCourses, getCourseById };
