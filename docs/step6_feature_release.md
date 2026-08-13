# 🔄 Production Feature Release Guide — Backend Updates (Ratings & Reviews)

A step-by-step tutorial for implementing a new feature (**Course Reviews & Ratings**) and rolling it out to a live production database and server on **Digital Ocean** or **Alibaba Cloud**.

> **New Feature**: Course Reviews and Ratings System
> **You will build**: `CourseReview` database table, reviews controllers/routes, and deploy the code live to production via PM2 zero-downtime updates.
> **You will learn**: DB schema updates, git deployment workflows, production migrations, and server hot-reloads.

---

## 📚 Table of Contents

1. [Release Flow: Local to Production](#1-release-flow-local-to-production)
2. [Step 1 — Coding the Reviews Feature (Local Development)](#step-1---coding-the-reviews-feature-local-development)
3. [Step 2 — Registering Reviews Entity & Routes](#step-2---registering-reviews-entity--routes)
4. [Step 3 — Hot-Deploying to Production Server](#step-3---hot-deploying-to-production-server)
5. [Completion Checklist](#completion-checklist)

---

## 1. Release Flow: Local to Production

When releasing a new feature to an active website:
1. **Develop locally**: Code the entity schemas, controllers, and routes in your local environment. Test using mock data.
2. **Commit and push**: Merge changes to the `main` branch and push to GitHub.
3. **Pull on server**: SSH into the production VM and pull the latest commits.
4. **Synchronize DB & Reload**: Restart the server daemon (PM2) to apply database structural changes and reload live API endpoints.

---

## Step 1 — Coding the Reviews Feature (Local Development)

### 1.1 Create the Review Entity
`src/modules/courses/review.entity.js`
```javascript
const { EntitySchema } = require("typeorm");

const CourseReview = new EntitySchema({
    name: "CourseReview",
    tableName: "course_reviews",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        rating: {
            type: "int", // 1 to 5 stars
            default: 5
        },
        comment: {
            type: "text",
            nullable: true
        },
        created_at: {
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
    }
});

module.exports = { CourseReview };
```

### 1.2 Create the Reviews Controller
`src/modules/courses/review.controller.js`
```javascript
const { CourseReview } = require("./review.entity");
const { AppDataSource } = require("../../configs/database");

const reviewRepository = () => AppDataSource.getRepository(CourseReview);

// @desc Add a review for a course
// @route POST /courses/:courseId/reviews
const addReview = async (req, res) => {
    const courseId = Number(req.params.courseId);
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const repo = reviewRepository();
    const review = repo.create({
        rating,
        comment,
        course: { id: courseId },
        user: { id: userId }
    });

    const data = await repo.save(review);
    res.status(201).json({ message: "Review added successfully", data });
};

// @desc Get all reviews for a course
// @route GET /courses/:courseId/reviews
const getCourseReviews = async (req, res) => {
    const courseId = Number(req.params.courseId);

    const data = await reviewRepository()
        .createQueryBuilder("review")
        .leftJoinAndSelect("review.user", "user")
        .where("review.courseId = :courseId", { courseId })
        .select(["review.id", "review.rating", "review.comment", "review.created_at", "user.username"])
        .orderBy("review.created_at", "DESC")
        .getMany();

    res.json({ message: "Reviews retrieved successfully", data });
};

module.exports = { addReview, getCourseReviews };
```

---

## Step 2 — Registering Reviews Entity & Routes

### 2.1 Register Schema in `database.js`
`src/configs/database.js`
```javascript
const { CourseReview } = require("../modules/courses/review.entity");

// Add CourseReview to your DataSource entities array:
entities: [User, Course, Enrollment, Section, Lesson, LessonProgress, CourseReview],
```

### 2.2 Mount endpoints in `courses.routes.js`
`src/modules/courses/courses.routes.js`
```javascript
const { addReview, getCourseReviews } = require("./review.controller");

// Reviews endpoints
router.get("/:courseId/reviews", getCourseReviews);
router.post("/:courseId/reviews", addReview); // Requires auth token (passed in server.js mount)
```

---

## Step 3 — Hot-Deploying to Production Server

Once local tests are completed, deploy the update directly to the live server.

1. **Commit and Push changes locally**:
   ```bash
   git add .
   git commit -m "feat: add course reviews and ratings"
   git push origin main
   ```
2. **Log in to the Cloud Server via SSH**:
   ```bash
   ssh root@<YOUR_VPS_IP>
   ```
3. **Pull changes and update Dependencies**:
   ```bash
   cd /var/www/course-platform-api
   git pull origin main
   npm install # If any package.json updates were introduced
   ```
4. **Hot-reload Node process in PM2**:
   TypeORM automatically creates the new `course_reviews` table in MySQL during boot because `synchronize: true` is configured in `database.js`. We reload the server with zero downtime using PM2:
   ```bash
   pm2 reload course-api
   ```
5. **Verify deployment**:
   ```bash
   pm2 status
   pm2 logs course-api
   ```

---

## Completion Checklist

- [ ] Coded local Review schemas and controllers.
- [ ] Registered Review routes inside `courses.routes.js`.
- [ ] Pushed stable main build updates to Github repository.
- [ ] Pulled updates inside cloud server environment via SSH.
- [ ] Reloaded live services using PM2 reload directives.
