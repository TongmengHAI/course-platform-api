const { Course } = require("./course.entity");
const { AppDataSource } = require("../../configs/database");
const { getPaginationParams, paginateQuery } = require("../../utils/pagination");

// Repository for the Course entity (reused by every handler).
const courseRepository = () => AppDataSource.getRepository(Course);

// @desc Get all courses
// @route GET /
const getAllCourses = async (req, res) => {
    // ---- Read & normalize query params ----
    // Pagination (shared helper — see utils/pagination.js)
    const { page, limit, skip } = getPaginationParams(req.query);

    // Search (free text across title + description)
    const search = (req.query.search || "").trim();

    // Filters
    const { category, level, instructorId, minPrice, maxPrice } = req.query;

    // Sort: sortBy=field, order=ASC|DESC
    const allowedSortFields = ["id", "title", "price", "category", "level"];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "id";
    const order = String(req.query.order).toUpperCase() === "ASC" ? "ASC" : "DESC";

    // ---- Build the query ----
    const qb = courseRepository()
        .createQueryBuilder("course")
        .leftJoinAndSelect("course.instructor", "instructor")
        .where("course.is_deleted = :isDeleted", { isDeleted: false });

    if (search) {
        qb.andWhere(
            "(course.title LIKE :search OR course.description LIKE :search)",
            { search: `%${search}%` }
        );
    }

    if (category) qb.andWhere("course.category = :category", { category });
    if (level) qb.andWhere("course.level = :level", { level });
    if (instructorId) qb.andWhere("course.instructorId = :instructorId", { instructorId: Number(instructorId) });
    if (minPrice !== undefined) qb.andWhere("course.price >= :minPrice", { minPrice: Number(minPrice) });
    if (maxPrice !== undefined) qb.andWhere("course.price <= :maxPrice", { maxPrice: Number(maxPrice) });

    qb.orderBy(`course.${sortBy}`, order);

    // Applies skip/take + getManyAndCount, returns { data, pagination }
    const { data, pagination } = await paginateQuery(qb, { page, limit, skip });

    res.json({
        message: "Courses retrieved successfully",
        data,
        pagination,
    });
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
