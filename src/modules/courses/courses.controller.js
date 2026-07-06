const { Course } = require("./course.entity");
const { AppDataSource } = require("../../configs/database");

// Repository for the Course entity (reused by every handler).
const courseRepository = () => AppDataSource.getRepository(Course);

// @desc Get all courses
// @route GET /
const getAllCourses = async (req, res) => {
    const data = await courseRepository()
        .createQueryBuilder("course")
        .leftJoinAndSelect("course.instructor", "instructor")
        .getMany();

        // select * from courses join users on courses.instructorId = users.id;

    res.json({ message: "Courses retrieved successfully", data });
};

// @desc Get single course by ID
// @route GET /:id
const getCourseById = async (req, res) => {
    const courseId = Number(req.params.id);

    const course = await courseRepository()
        .createQueryBuilder("course")
        .leftJoinAndSelect("course.instructor", "instructor")
        .where("course.id = :id", { id: courseId })
        .getOne();

    if (!course) return res.status(404).json({ message: "Course not found" });

    res.json({ message: "Course retrieved successfully", data: course });
};

// @desc Create a new course
// @route POST /
const createCourse = async (req, res) => {
    const { title, description, category, level, price, instructorId } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }

    const repo = courseRepository();
    const course = repo.create({
        title,
        description,
        category,
        level,
        price,
        instructor: instructorId ? { id: instructorId } : null,
    });
    const data = await repo.save(course);

    res.status(201).json({ message: "Course created successfully", data });
};

// @desc Update an existing course
// @route PUT /:id
const updateCourse = async (req, res) => {
    const courseId = Number(req.params.id);
    const { title, description, category, level, price, instructorId } = req.body;

    const repo = courseRepository();
    const course = await repo.findOneBy({ id: courseId });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only overwrite fields that were actually provided.
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (price !== undefined) course.price = price;
    if (instructorId !== undefined) course.instructor = instructorId ? { id: instructorId } : null;

    const data = await repo.save(course);

    res.json({ message: "Course updated successfully", data });
};

// @desc Delete a course
// @route DELETE /:id
const deleteCourse = async (req, res) => {
    const courseId = Number(req.params.id);

    const repo = courseRepository();
    const course = await repo.findOneBy({ id: courseId });

    if (!course) return res.status(404).json({ message: "Course not found" });

    // hard delete the course (no soft delete implemented)
    await repo.remove(course);

    res.json({ message: "Course deleted successfully", data: null });
};

// @desc Soft delete a course
const softDeleteCourse = async (req, res) => {
    const courseId = Number(req.params.id);

    const repo = courseRepository();
    const course = await repo.findOneBy({ id: courseId });

    if (!course) return res.status(404).json({ message: "Course not found" });

    course.is_deleted = true;

    // hard delete the course (no soft delete implemented)
    await repo.save(course);

    res.json({ message: "Course deleted successfully", data: null });
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    softDeleteCourse
};
