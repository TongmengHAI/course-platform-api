# 🎓 Enrollment System Backend — Zero to Completed

A step-by-step guide for building the Enrollment System in the **Online Course Platform** backend, mapping students to courses, preventing duplicate signups, and retrieving active enrollment records.

> **Stack:** Node.js · Express.js · MySQL · TypeORM
> **You will build:** `Enrollment` Entity, `enrollments.controller.js`, `enrollments.routes.js`, and route registrations in `server.js`.
> **You will learn:** Relational database mapping, compound unique indexes, joining datasets in TypeORM query builder, and database error handling.

---

## 📚 Table of Contents

1. [Understanding the Enrollment Relationship](#1-understanding-the-enrollment-relationship)
2. [Step 1 — Creating the Enrollment Entity Schema](#step-1--creating-the-enrollment-entity-schema)
3. [Step 2 — Registering Entity in DataSource Configuration](#step-2---registering-entity-in-datasource-configuration)
4. [Step 3 — Writing the Enrollment Controller Handler](#step-3---writing-the-enrollment-controller-handler)
5. [Step 4 — Defining the Routes Router File](#step-4---defining-the-routes-router-file)
6. [Step 5 — Mounting Route in Main Application Server](#step-5---mounting-route-in-main-application-server)
7. [Testing with Postman](#testing-with-postman)
8. [Common Errors & Fixes](#common-errors--fixes)
9. [Completion Checklist](#completion-checklist)

---

## 1. Understanding the Enrollment Relationship

An **Enrollment** maps a **User** (role: `student`) to a **Course**. 
- It represents a **Many-to-Many** relationship: a user can enroll in many courses, and a course can have many students.
- To prevent database clutter, we must ensure a student cannot enroll in the same course twice. We enforce this using a compound unique database index constraint on `(userId, courseId)`.

---

## Step 1 — Creating the Enrollment Entity Schema

Create a schema mapping file. We use TypeORM's `EntitySchema` syntax to define the database columns and table relations.

`src/modules/enrollments/enrollment.entity.js`
```javascript
const { EntitySchema } = require("typeorm");

const Enrollment = new EntitySchema({
    name: "Enrollment",
    tableName: "enrollments",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        enrolled_at: {
            type: "timestamp",
            createDate: true
        }
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId" },
            nullable: false,
            onDelete: "CASCADE"
        },
        course: {
            type: "many-to-one",
            target: "Course",
            joinColumn: { name: "courseId" },
            nullable: false,
            onDelete: "CASCADE"
        }
    },
    indices: [
        {
            name: "IDX_USER_COURSE_UNIQUE",
            unique: true,
            columns: ["userId", "courseId"]
        }
    ]
});

module.exports = { Enrollment };
```

---

## Step 2 — Registering Entity in DataSource Configuration

Import the new `Enrollment` schema and add it to the TypeORM datasource config `entities` array.

`src/configs/database.js`
```javascript
const { User } = require("../modules/users/user.entity");
const { Course } = require("../modules/courses/course.entity");
const { Enrollment } = require("../modules/enrollments/enrollment.entity"); // ⬅️ Add this import

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "course_platform",
    synchronize: true, // Auto-creates database table when server boots
    entities: [User, Course, Enrollment], // ⬅️ Register here
});
```

---

## Step 3 — Writing the Enrollment Controller Handler

Create the business logic controller. It needs two primary functions:
1. **`enrollInCourse`**: Enrolls the authenticated user in a target course.
2. **`getMyCourses`**: Fetches all courses the authenticated student is currently enrolled in.

`src/modules/enrollments/enrollments.controller.js`
```javascript
const { Enrollment } = require("./enrollment.entity");
const { Course } = require("../courses/course.entity");
const { AppDataSource } = require("../../configs/database");

const enrollmentRepository = () => AppDataSource.getRepository(Enrollment);
const courseRepository = () => AppDataSource.getRepository(Course);

// @desc Enroll a user in a course
// @route POST /enrollments
const enrollInCourse = async (req, res) => {
    const courseId = Number(req.body.courseId);
    const userId = req.user.id; // Assigned by token validation auth middleware

    if (!courseId) {
        return res.status(400).json({ message: "courseId is required" });
    }

    // Verify target course exists
    const course = await courseRepository().findOneBy({ id: courseId });
    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    const repo = enrollmentRepository();
    
    // Check if enrollment already exists (pre-flight check)
    const existing = await repo.findOneBy({
        user: { id: userId },
        course: { id: courseId }
    });

    if (existing) {
        return res.status(400).json({ message: "Already enrolled in this course" });
    }

    const enrollment = repo.create({
        user: { id: userId },
        course: { id: courseId }
    });

    try {
        const saved = await repo.save(enrollment);
        res.status(201).json({
            message: "Enrolled successfully",
            data: saved
        });
    } catch (err) {
        // Handle database unique constraint exception
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Already enrolled in this course" });
        }
        res.status(500).json({ message: "Error enrolling in course" });
    }
};

// @desc Get current user's enrolled courses
// @route GET /enrollments/my-courses
const getMyCourses = async (req, res) => {
    const userId = req.user.id;

    try {
        const enrollments = await enrollmentRepository()
            .createQueryBuilder("enrollment")
            .leftJoinAndSelect("enrollment.course", "course")
            .leftJoinAndSelect("course.instructor", "instructor")
            .where("enrollment.userId = :userId", { userId })
            .getMany();

        // Extract joined course records from enrollment envelope objects
        const courses = enrollments.map(e => e.course);

        res.json({
            message: "My enrolled courses retrieved successfully",
            data: courses
        });
    } catch (err) {
        res.status(500).json({ message: "Error retrieving enrolled courses" });
    }
};

module.exports = { enrollInCourse, getMyCourses };
```

---

## Step 4 — Defining the Routes Router File

Create a router linking incoming requests directly to the controller handlers.

`src/modules/enrollments/enrollments.routes.js`
```javascript
const express = require("express");
const router = express.Router();
const { enrollInCourse, getMyCourses } = require("./enrollments.controller");

// Both endpoints are mounted on an authenticated path in server.js
router.post("", enrollInCourse);         // POST /enrollments
router.get("/my-courses", getMyCourses);  // GET  /enrollments/my-courses

module.exports = router;
```

---

## Step 5 — Mounting Route in Main Application Server

Import and mount the new enrollments routes under `/enrollments` in `server.js`. Apply the `auth` middleware to ensure all enrollment operations have an active session user token.

`server.js`
```javascript
const enrollmentRoutes = require("./src/modules/enrollments/enrollments.routes"); // ⬅️ Add import

// Routes
app.use("/courses", auth, courseRoutes);
app.use("/enrollments", auth, enrollmentRoutes); // ⬅️ Mount router
app.use("/users", auth, authorize("admin"), userRoutes);
app.use("/auth", authRoutes);
```

---

## Testing with Postman

### 1. Register Enrollment
- **Method:** `POST`
- **URL:** `http://localhost:5000/enrollments`
- **Headers:** `Authorization: Bearer <STUDENT_JWT_TOKEN>`
- **Body (JSON):**
  ```json
  {
    "courseId": 2
  }
  ```
- **Expected Status:** `201 Created`
- **Repeat Request Verify:** Subsequent requests return `400 Bad Request` with message: `"Already enrolled in this course"`.

### 2. Get My Learning Courses
- **Method:** `GET`
- **URL:** `http://localhost:5000/enrollments/my-courses`
- **Headers:** `Authorization: Bearer <STUDENT_JWT_TOKEN>`
- **Expected Status:** `200 OK` (returns array listing enrolled course entities).

---

## Common Errors & Fixes

| Symptom | Cause | Remedy |
|---|---|---|
| `ER_NO_REFERENCED_ROW_2` (Foreign Key Error) | The course ID specified in request body does not exist in `courses` table. | Check database course registers and supply a valid course ID. |
| `Cannot read properties of undefined (reading 'id')` | The token validation middleware did not parse the user token correctly, or was not executed. | Verify that `/enrollments` route is mounted with `auth` middleware in `server.js`. |

---

## Completion Checklist

- [ ] Created mapping schema files containing joint column settings in `enrollment.entity.js`.
- [ ] Registered Enrollment Entity inside central TypeORM schema configuration arrays.
- [ ] Built database verification structures checking duplicate signups inside the controller.
- [ ] Programmed joined queries extracting mapped courses based on authenticated user IDs.
- [ ] Established routing config under `/enrollments` requiring global token auth middleware.
