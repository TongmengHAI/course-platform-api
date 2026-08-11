# 📖 Sections, Lessons & Progress Backend — Zero to Completed

A step-by-step guide for implementing sections, lessons, and lesson progress tracking in the **Online Course Platform** backend.

> **Stack:** Node.js · Express.js · MySQL · TypeORM
> **You will build:** `Section`, `Lesson`, and `LessonProgress` Entities, and controllers/routes for course content and progress tracking.
> **You will learn:** Hierarchical entity relationships (One-to-Many / Many-to-One), compound indexes, and toggling completion records.

---

## 📚 Table of Contents

1. [Database Schema (Content & Progress)](#1-database-schema-content--progress)
2. [Step 1 — Creating the Section & Lesson Entities](#step-1--creating-the-section--lesson-entities)
3. [Step 2 — Creating the LessonProgress Entity](#step-2---creating-the-lessonprogress-entity)
4. [Step 3 — Registering Entities in DataSource](#step-3---registering-entities-in-datasource)
5. [Step 4 — Implementing Section & Lesson Controllers](#step-4---implementing-section--lesson-controllers)
6. [Step 5 — Implementing the Progress Controller](#step-5---implementing-the-progress-controller)
7. [Step 6 — Mapping Routes & Mounting](#step-6---mapping-routes--mounting)
8. [Testing with Postman](#testing-with-postman)
9. [Completion Checklist](#completion-checklist)

---

## 1. Database Schema (Content & Progress)

```
  ┌───────────┐          ┌────────────┐          ┌───────────┐
  │  courses  │          │  sections  │          │  lessons  │
  ├───────────┤          ├────────────┤          ├───────────┤
  │ id (PK)   │ 1 ──── * │ id (PK)    │ 1 ──── * │ id (PK)   │
  │ title     │          │ course_id  │          │ section_id│
  └───────────┘          │ title      │          │ title     │
                         │ sort_order │          │ content   │
                         └────────────┘          └─────┬─────┘
                                                       │ 1
                                                       └─────┐
                                                             ▼ *
                                                   ┌─────────────────┐
                                                   │ lesson_progress │
                                                   ├─────────────────┤
                                                   │ id (PK)         │
                                                   │ userId (FK)     │
                                                   │ lessonId (FK)   │
                                                   │ is_completed    │
                                                   └─────────────────┘
```

---

## Step 1 — Creating the Section & Lesson Entities

Create the entity schemas representing sections and lessons.

### 1.1 Section Entity
`src/modules/courses/section.entity.js`
```javascript
const { EntitySchema } = require("typeorm");

const Section = new EntitySchema({
    name: "Section",
    tableName: "sections",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        title: {
            type: "varchar"
        },
        sort_order: {
            type: "int",
            default: 0
        }
    },
    relations: {
        course: {
            type: "many-to-one",
            target: "Course",
            joinColumn: { name: "courseId" },
            nullable: false,
            onDelete: "CASCADE"
        },
        lessons: {
            type: "one-to-many",
            target: "Lesson",
            inverseSide: "section"
        }
    }
});

module.exports = { Section };
```

### 1.2 Lesson Entity
`src/modules/courses/lesson.entity.js`
```javascript
const { EntitySchema } = require("typeorm");

const Lesson = new EntitySchema({
    name: "Lesson",
    tableName: "lessons",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        title: {
            type: "varchar"
        },
        content: {
            type: "text",
            nullable: true
        },
        sort_order: {
            type: "int",
            default: 0
        }
    },
    relations: {
        section: {
            type: "many-to-one",
            target: "Section",
            joinColumn: { name: "sectionId" },
            nullable: false,
            onDelete: "CASCADE"
        }
    }
});

module.exports = { Lesson };
```

---

## Step 2 — Creating the LessonProgress Entity

Create the entity to track lesson completion progress for students. We use a compound unique constraint on `(userId, lessonId)`.

`src/modules/enrollments/progress.entity.js`
```javascript
const { EntitySchema } = require("typeorm");

const LessonProgress = new EntitySchema({
    name: "LessonProgress",
    tableName: "lesson_progress",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        is_completed: {
            type: "boolean",
            default: false
        },
        completed_at: {
            type: "timestamp",
            nullable: true
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
        lesson: {
            type: "many-to-one",
            target: "Lesson",
            joinColumn: { name: "lessonId" },
            nullable: false,
            onDelete: "CASCADE"
        }
    },
    indices: [
        {
            name: "IDX_USER_LESSON_UNIQUE",
            unique: true,
            columns: ["userId", "lessonId"]
        }
    ]
});

module.exports = { LessonProgress };
```

---

## Step 3 — Registering Entities in DataSource

Import the three new schemas inside the database configuration.

`src/configs/database.js`
```javascript
const { User } = require("../modules/users/user.entity");
const { Course } = require("../modules/courses/course.entity");
const { Enrollment } = require("../modules/enrollments/enrollment.entity");
const { Section } = require("../modules/courses/section.entity");
const { Lesson } = require("../modules/courses/lesson.entity");
const { LessonProgress } = require("../modules/enrollments/progress.entity");

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "course_platform",
    synchronize: true, // TypeORM auto-creates tables on next boot
    entities: [User, Course, Enrollment, Section, Lesson, LessonProgress],
});
```

---

## Step 4 — Implementing Section & Lesson Controllers

Instructors need endpoints to build sections and add lessons.

`src/modules/courses/content.controller.js`
```javascript
const { Section } = require("./section.entity");
const { Lesson } = require("./lesson.entity");
const { AppDataSource } = require("../../configs/database");

const sectionRepository = () => AppDataSource.getRepository(Section);
const lessonRepository = () => AppDataSource.getRepository(Lesson);

// @desc Create a section inside a course
// @route POST /courses/:courseId/sections
const createSection = async (req, res) => {
    const courseId = Number(req.params.courseId);
    const { title, sort_order } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }

    const repo = sectionRepository();
    const section = repo.create({ title, sort_order, course: { id: courseId } });
    const data = await repo.save(section);

    res.status(201).json({ message: "Section created successfully", data });
};

// @desc Create a lesson inside a section
// @route POST /sections/:sectionId/lessons
const createLesson = async (req, res) => {
    const sectionId = Number(req.params.sectionId);
    const { title, content, sort_order } = req.body;

    if (!title) {
        return res.status(400).json({ message: "title is required" });
    }

    const repo = lessonRepository();
    const lesson = repo.create({ title, content, sort_order, section: { id: sectionId } });
    const data = await repo.save(lesson);

    res.status(201).json({ message: "Lesson created successfully", data });
};

// @desc Get full syllabus structure of a course
// @route GET /courses/:courseId/syllabus
const getCourseSyllabus = async (req, res) => {
    const courseId = Number(req.params.courseId);

    const sections = await sectionRepository()
        .createQueryBuilder("section")
        .leftJoinAndSelect("section.lessons", "lessons")
        .where("section.courseId = :courseId", { courseId })
        .orderBy("section.sort_order", "ASC")
        .addOrderBy("lessons.sort_order", "ASC")
        .getMany();

    res.json({ message: "Course syllabus retrieved", data: sections });
};

module.exports = { createSection, createLesson, getCourseSyllabus };
```

---

## Step 5 — Implementing the Progress Controller

Students need to toggle lesson progress completion status.

`src/modules/enrollments/progress.controller.js`
```javascript
const { LessonProgress } = require("./progress.entity");
const { AppDataSource } = require("../../configs/database");

const progressRepository = () => AppDataSource.getRepository(LessonProgress);

// @desc Toggle lesson progress completion status
// @route POST /progress
const toggleLessonProgress = async (req, res) => {
    const lessonId = Number(req.body.lessonId);
    const { isCompleted } = req.body; // true or false
    const userId = req.user.id;

    if (!lessonId) {
        return res.status(400).json({ message: "lessonId is required" });
    }

    const repo = progressRepository();
    let progress = await repo.findOneBy({
        user: { id: userId },
        lesson: { id: lessonId }
    });

    if (progress) {
        progress.is_completed = isCompleted;
        progress.completed_at = isCompleted ? new Date() : null;
    } else {
        progress = repo.create({
            user: { id: userId },
            lesson: { id: lessonId },
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date() : null
        });
    }

    const saved = await repo.save(progress);
    res.json({ message: "Progress updated successfully", data: saved });
};

// @desc Fetch student's overall progress list for a course
// @route GET /courses/:courseId/progress
const getCourseProgress = async (req, res) => {
    const courseId = Number(req.params.courseId);
    const userId = req.user.id;

    const progressRecords = await progressRepository()
        .createQueryBuilder("progress")
        .innerJoin("progress.lesson", "lesson")
        .innerJoin("lesson.section", "section")
        .where("progress.userId = :userId", { userId })
        .andWhere("section.courseId = :courseId", { courseId })
        .select(["progress.id", "progress.is_completed", "lesson.id"])
        .getMany();

    res.json({ message: "Course progress retrieved", data: progressRecords });
};

module.exports = { toggleLessonProgress, getCourseProgress };
```

---

## Step 6 — Mapping Routes & Mounting

### 6.1 Register syllabus routes
Append content administration routes directly into `src/modules/courses/courses.routes.js`.

`src/modules/courses/courses.routes.js`
```javascript
const { createSection, createLesson, getCourseSyllabus } = require("./content.controller");

// Syllabus read endpoints
router.get("/:courseId/syllabus", getCourseSyllabus);

// Syllabus mutation endpoints (restriced to instructor/admin)
router.post("/:courseId/sections", authorize("instructor", "admin"), createSection);
router.post("/sections/:sectionId/lessons", authorize("instructor", "admin"), createLesson);
```

### 6.2 Register progress routes
Add new routing pathways inside `src/modules/enrollments/enrollments.routes.js`.

`src/modules/enrollments/enrollments.routes.js`
```javascript
const { toggleLessonProgress, getCourseProgress } = require("./progress.controller");

router.post("/progress", toggleLessonProgress);
router.get("/:courseId/progress", getCourseProgress);
```

---

## Testing with Postman

### 1. Create a Section
* **Method**: `POST`
* **URL**: `http://localhost:5000/courses/1/sections`
* **Headers**: `Authorization: Bearer <INSTRUCTOR_TOKEN>`
* **Body (JSON)**:
  ```json
  { "title": "Syllabus Section 1", "sort_order": 1 }
  ```

### 2. Mark Lesson Completed
* **Method**: `POST`
* **URL**: `http://localhost:5000/enrollments/progress`
* **Headers**: `Authorization: Bearer <STUDENT_TOKEN>`
* **Body (JSON)**:
  ```json
  { "lessonId": 1, "isCompleted": true }
  ```

---

## Completion Checklist

- [ ] Defined structural entities mapped to database tables.
- [ ] Registered entities into dataSource entities lists.
- [ ] Programmed handlers adding sections/lessons.
- [ ] Developed query filters retrieving syllabus hierarchies.
- [ ] Programmed progress toggling updates.
- [ ] Integrated endpoints in `courses.routes.js` and `enrollments.routes.js`.
