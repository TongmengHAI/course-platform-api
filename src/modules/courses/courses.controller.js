const { Course } = require("./course.entity");
const { AppDataSource } = require("../../configs/database");

// @desc Get all courses
// @route GET /
const getAllCourses = async (req, res) => {
    const data = await AppDataSource
        .getRepository(Course)
        .createQueryBuilder("course")
        .getMany();

    res.json({ message: "Courses retrieved successfully", data });
};



// @desc Get single course by ID
// @route GET /:id
const getCourseById = async (req, res) => {
    const courseId = Number(req.params.id);

    const course = await AppDataSource
        .getRepository(Course)
        .createQueryBuilder("course")
        .where("course.id = :id", { id: courseId })
        .getOne();

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json({ message: "Course retrieved successfully", data: course });
};
module.exports = { getAllCourses, getCourseById };
