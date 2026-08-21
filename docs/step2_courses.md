# 📚 Course Management Backend — Zero to Completed

A step-by-step guide for adjusting the Course Access Control, protecting mutating routes, and managing courses in the **Online Course Platform** backend.

> **Stack:** Node.js · Express.js · MySQL · TypeORM
> **You will build/configure:** Route authorization adjustments in `server.js` and `courses.routes.js`
> **You will learn:** Fine-grained authorization, protecting specific HTTP methods (POST, PUT, DELETE, PATCH), and allowing public access to read-only endpoints (GET).

---

## 📚 Table of Contents

1. [Understanding Course Access Rules](#1-understanding-course-access-rules)
2. [Step 1 — Refactoring Route Mounting in `server.js`](#step-1--refactoring-route-mounting-in-serverjs)
3. [Step 2 — Splitting Permissions in `courses.routes.js`](#step-2---splitting-permissions-in-coursesroutesjs)
4. [Step 3 — Auto-associating Instructor Session in `courses.controller.js`](#step-3--auto-associating-instructor-session-in-coursescontrollerjs)
5. [Testing Course Endpoints](#testing-course-endpoints)
6. [Common Errors & Fixes](#common-errors--fixes)
7. [Completion Checklist](#completion-checklist)

---

## 1. Understanding Course Access Rules

Here is a breakdown of what each user role is permitted to perform in the course management backend:

| Role | Browse Catalog (`GET /courses`) | View Detail (`GET /courses/:id`) | Create Course (`POST /courses`) | Edit Course (`PUT /courses/:id`) |
|---|:---:|:---:|:---:|:---:|
| **Guest (Unauthenticated)** | ✅ | ✅ | ❌ | ❌ |
| **Student** | ✅ | ✅ | ❌ | ❌ |
| **Instructor** | ✅ | ✅ | ✅ (Own) | ✅ (Own) |
| **Admin** | ✅ | ✅ | ✅ (All) | ✅ (All) |

> [!NOTE]
> Instructors are authorized to create and manage their own courses on the database level, while Admins have permission to manage all courses globally.

Currently, the server restricts the entire `/courses` mount path to instructors and admins. We need to refactor the security rules so that only mutating routes require authorization (such as POST, PUT, DELETE), while read-only routes (GET) are open to everyone without token requirements.

---

## Step 1 — Refactoring Route Mounting in `server.js`

Open `server.js` and remove the global `auth` and `authorize` check from the `/courses` path mounting. This allows guest users to read the catalog and detail pages, moving authorization to individual routes inside `courses.routes.js`.

`server.js`
```javascript
// Before:
app.use("/courses", auth, authorize("instructor", "admin"), courseRoutes);

// After: (Decouple auth globally so read-only routes are open to guests)
app.use("/courses", courseRoutes);
```

---

## Step 2 — Splitting Permissions in `courses.routes.js`

Open `src/modules/courses/courses.routes.js`. Import both `auth` and `authorize` helpers, and apply them explicitly to writing operations, while leaving read-only operations open.

`src/modules/courses/courses.routes.js`
```javascript
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
```

---

## Step 3 — Auto-associating Instructor Session in `courses.controller.js`

To prevent creating or updating courses with a `null` instructor, we should automatically read the logged-in user's ID from the JWT token payload (`req.user.id`) and bind it to the course relation.

`src/modules/courses/courses.controller.js`
```javascript
// 1) Inside createCourse:
const createCourse = async (req, res) => {
    const { title, description, category, level, price } = req.body;
    
    // Read the instructor ID from the authenticated token payload
    const instructorId = req.user?.id || req.body.instructorId;

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
        instructor: instructorId ? { id: Number(instructorId) } : null,
    });
    const data = await repo.save(course);
    res.status(201).json({ message: "Course created successfully", data });
};

// 2) Inside updateCourse:
const updateCourse = async (req, res) => {
    const courseId = Number(req.params.id);
    const { title, description, category, level, price } = req.body;

    const repo = courseRepository();
    const course = await repo.findOne({ 
        where: { id: courseId },
        relations: { instructor: true }
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) course.level = level;
    if (price !== undefined) course.price = price;

    // Auto-associate with the current session's authenticated user if missing or updated
    const finalInstructorId = req.body.instructorId || req.user?.id;
    if (finalInstructorId) {
        course.instructor = { id: Number(finalInstructorId) };
    }

    const data = await repo.save(course);
    res.json({ message: "Course updated successfully", data });
};
```

---

## Testing Course Endpoints

Use Postman to confirm that student roles cannot create or edit courses, but can search and read them.

### 1. Browse Courses (Student Token)
- **Method:** `GET`
- **URL:** `http://localhost:5000/courses`
- **Headers:** `Authorization: Bearer <STUDENT_JWT_TOKEN>`
- **Expected Status:** `200 OK`

### 2. Create Course (Student Token)
- **Method:** `POST`
- **URL:** `http://localhost:5000/courses`
- **Headers:** `Authorization: Bearer <STUDENT_JWT_TOKEN>`
- **Body (JSON):**
  ```json
  {
    "title": "Intro to Web Dev",
    "description": "Learn HTML, CSS and Javascript",
    "category": "Programming",
    "level": "Beginner",
    "price": 49
  }
  ```
- **Expected Status:** `403 Forbidden` (message: `"You do not have permission"`)

### 3. Create Course (Instructor Token)
- **Method:** `POST`
- **URL:** `http://localhost:5000/courses`
- **Headers:** `Authorization: Bearer <INSTRUCTOR_JWT_TOKEN>`
- **Body (JSON):** (Same as above)
- **Expected Status:** `201 Created`

---

## Common Errors & Fixes

| Symptom | Cause | Remedy |
|---|---|---|
| `401 Unauthorized` on write operations | Missing token in Request headers. | Add `Authorization: Bearer <token>` in Postman request settings. |
| `401 Unauthorized` on `GET /courses` | Global `auth` middleware was not removed in `server.js`. | Check `server.js` and verify `/courses` is mounted as `app.use("/courses", courseRoutes)` without middleware. |

---

## Completion Checklist

- [ ] Relocated global course mounting path filters inside `server.js`.
- [ ] Imported authorize rules inside `src/modules/courses/courses.routes.js`.
- [ ] Configured token permissions on `GET /courses` allow student requests.
- [ ] Configured mutating endpoints (`POST`, `PUT`, `DELETE`, `PATCH`) to require role authentication.
- [ ] Tested endpoint restriction flows using student and instructor access tokens.
