# 🗺️ Fullstack Master Curriculum & Implementation Plan

A detailed master implementation plan and curriculum syllabus mapping the end-to-end development, manual deployment, and post-deployment incremental updates of the **Online Course Platform**.

---

## 📚 Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Database Schema Entity Relational Diagram (ERD)](#2-database-schema-entity-relational-diagram-erd)
3. [Implementation Phases & Detailed File Specifications](#3-implementation-phases--detailed-file-specifications)
   - [Phase 1: Authentication, Course CRUD & Enrollments](#phase-1-authentication-course-crud--enrollments)
   - [Phase 2: Course Content & Progress Tracking](#phase-2-course-content--progress-tracking)
   - [Phase 3: Manual Cloud Production Deployment](#phase-3-manual-cloud-production-deployment)
   - [Phase 4: Post-Deployment Feature Release (Reviews System)](#phase-4-post-deployment-feature-release-reviews-system)
4. [Standard API Design & Interface Envelopes](#4-standard-api-design--interface-envelopes)
5. [Step-by-Step Student Teaching Calendar](#5-step-by-step-student-teaching-calendar)

---

## 1. System Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            CLIENT LAYER (UI)                            │
 │  React 19  ·  Ant Design (antd)  ·  Tailwind CSS  ·  React Router DOM  │
 └──────────────────────────────────┬──────────────────────────────────────┘
                                    │ HTTP Requests (Axios interceptor)
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                            SERVER LAYER (API)                           │
 │   Express.js Application  ·  JWT Middleware  ·  PM2 Process Manager     │
 └──────────────────────────────────┬──────────────────────────────────────┘
                                    │ Object Relational Mapping (TypeORM)
                                    ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                             DATABASE LAYER                              │
 │            MySQL Server (Relational Tables, Compound Indexes)           │
 └─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema Entity Relational Diagram (ERD)

```
  ┌──────────────┐             ┌─────────────────┐             ┌──────────────┐
  │    users     │             │   enrollments   │             │   courses    │
  ├──────────────┤             ├─────────────────┤             ├──────────────┤
  │ id (PK)      │ 1 ─────── * │ id (PK)         │ * ─────── 1 │ id (PK)      │
  │ username     │             │ userId (FK)     │             │ instructorId │
  │ email        │             │ courseId (FK)   │             │ title        │
  │ password     │             │ enrolled_at     │             │ description  │
  │ role         │             └─────────────────┘             │ price        │
  └──────┬───────┘                                             └──────┬───────┘
         │ 1                                                          │ 1
         │                                                            │
         │ *                                                          │ *
  ┌──────┴───────┐             ┌─────────────────┐             ┌──────┴───────┐
  │course_reviews│             │ lesson_progress │             │   sections   │
  ├──────────────┤             ├─────────────────┤             ├──────────────┤
  │ id (PK)      │ * ─────── 1 │ id (PK)         │             │ id (PK)      │
  │ userId (FK)  │             │ userId (FK)     │             │ courseId (FK)│
  │ courseId (FK)│             │ lessonId (FK)   │ * ─────── 1 │ title        │
  │ rating (1-5) │             │ is_completed    │             │ sort_order   │
  │ comment      │             └─────────────────┘             └──────┬───────┘
  └──────────────┘                                                    │ 1
                                                                      │
                                                                      │ *
                                                               ┌──────┴───────┐
                                                               │   lessons    │
                                                               ├──────────────┤
                                                               │ id (PK)      │
                                                               │ sectionId(FK)│
                                                               │ title        │
                                                               │ content      │
                                                               │ sort_order   │
                                                               └──────────────┘
```

---

## 3. Implementation Phases & Detailed File Specifications

### Phase 1: Authentication, Course CRUD & Enrollments

#### 1.1 Backend Modules Setup
* **Authentication**: Setup `bcrypt` password hashing on user registration, and sign JWT tokens upon login:
  * `src/modules/auth/auth.controller.js` (Register and Login logic)
  * `src/modules/auth/auth.service.js` (Verify hashes)
  * `src/middlewares/auth.js` (`auth` and `authorize` middleware blocks)
* **Access Restructuring**: Move role authorization controls out of global server mount files into route registries:
  * `server.js` (Remove global authorize checks)
  * `src/modules/courses/courses.routes.js` (Apply `authorize("instructor", "admin")` to mutations only)
* **Enrollments**: Build database tables associating students to course catalog ids, restricting double signups:
  * `src/modules/enrollments/enrollment.entity.js` (Compound unique index constraint on `userId` + `courseId`)
  * `src/modules/enrollments/enrollments.controller.js` (`enrollInCourse` and `getMyCourses` actions)
  * `src/modules/enrollments/enrollments.routes.js` (Map paths)

#### 1.2 Frontend Screens Setup
* **Auth Context**: Persist logged-in tokens inside local browser memory (`localStorage`):
  * `src/context/AuthContext.jsx` (Manage profile state, login, register, and logout)
* **Course Catalog**: Search and category/difficulty level filtering:
  * `src/pages/CourseCatalogPage.jsx` (List courses, retrieve queries)
* **Detail and Editor Form**: Details display, dynamic create/edit modes, and enrollment click handlers:
  * `src/pages/CourseDetailPage.jsx` ("Enroll Now" triggers)
  * `src/pages/CourseEditorPage.jsx` (Ant Design form validation)
* **Dashboard Wiring**: Render dynamic cards inside dashboards:
  * `src/pages/StudentDashboardPage.jsx` (List enrolled courses)
  * `src/pages/InstructorDashboardPage.jsx` (Owned course administrative table)

---

### Phase 2: Course Content & Progress Tracking

#### 2.1 Backend Modules Setup
* **Syllabus Content**: Map hierarchies matching sections and lessons:
  * `src/modules/courses/section.entity.js` (Section metadata)
  * `src/modules/courses/lesson.entity.js` (Lesson content details)
  * `src/modules/courses/content.controller.js` (Create sections/lessons, fetch full syllabus query)
* **Progress Tracking**: Record completion statuses:
  * `src/modules/enrollments/progress.entity.js` (Compound unique index constraint on `userId` + `lessonId`)
  * `src/modules/enrollments/progress.controller.js` (`toggleLessonProgress` and `getCourseProgress` actions)

#### 2.2 Frontend Screens Setup
* **Lesson Viewer**: Collapsible syllabus left panel and content reader panel:
  * `src/pages/LessonViewerPage.jsx` (Split-pane template, completion checkboxes, status icon updates)
* **Dashboard Progress**: Render active progress percentage stats:
  * `src/pages/StudentDashboardPage.jsx` (Ant Design `<Progress />` indicators)

---

### Phase 3: Manual Cloud Production Deployment

Manually deploy the MVP application on a Linux VM instance to teach server administration.

#### 3.1 Backend & Database VPS Manual Deployment
1. Provision **Ubuntu 22.04 LTS** instance on **Digital Ocean** or **Alibaba Cloud (ECS)**.
2. Install **MySQL Server**, secure root access, create `online_course_platform` database, and grant privileges to localhost system accounts.
3. Install **Node.js LTS v20** and clone code into `/var/www/course-platform-api`.
4. Create environment variable file `.env` configuring backend ports and credentials.
5. Install **PM2** process manager globally to keep the Node API server running in the background.
6. Install and configure **Nginx** reverse proxy to redirect traffic on port `80` to PM2 internal service port `5000`.
7. Configure SSL certificates utilizing **Certbot / Let's Encrypt** to encrypt endpoints.

#### 3.2 Frontend Compilation & CDN Hosting
1. Build optimized static bundle locally: `npm run build`.
2. Deploy output static files folder (`/dist`) directly to a managed global hosting service (**Vercel** or **Netlify**) setting environment endpoints variables `VITE_API_URL` pointing to the secure VM URL.

---

### Phase 4: Post-Deployment Feature Release (Reviews System)

Deploy incremental updates to a live production environment.

#### 4.1 Local Review Features Development
* Build comments and ratings system database schemes:
  * `src/modules/courses/review.entity.js` (Review schemas)
  * `src/modules/courses/review.controller.js` (`addReview` and `getCourseReviews` handlers)
* Build feedback form blocks and rate inputs on frontend:
  * `src/pages/CourseDetailPage.jsx` (Ant Design `<Rate />` stars and `<List />` feeds)

#### 4.2 Cloud Deployment Updates Execution
1. Push local changes to GitHub `main` branch.
2. Log in to the Cloud Server via SSH, pull latest commits, and trigger hot-reloads using PM2:
   ```bash
   git pull origin main
   pm2 reload course-api # Auto-syncs database tables structures via TypeORM
   ```
3. Trigger redeployment builds on Vercel/Netlify to update UI components.

---

## 4. Standard API Design & Interface Envelopes

Every paginated and list controller must wrap returned JSON database values inside this standard envelope payload structure:

```json
{
  "message": "Success notification details",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasPrev": false,
    "hasNext": true
  }
}
```

---

## 5. Step-by-Step Student Teaching Calendar

| Period | Topic Modules | Key Student Deliverables |
| :--- | :--- | :--- |
| **Week 1-2** | UI Shell & Authentication | Login/Register forms, router configuration, local storage token context. |
| **Week 3-4** | Course Catalog & Management | Filterable course grids, course creator editors, course detail views. |
| **Week 5-6** | Syllabus & Enrollments | Relational join database tables, course syllabus creation, enrollments workflows. |
| **Week 7-8** | Progress Tracking | Split-pane lesson viewer pages, progress bars inside dashboards. |
| **Week 9-10** | Cloud VM Deployment | Live provisioning on cloud providers, PM2, Nginx, Let's Encrypt SSL. |
| **Week 11-12** | Production Feature Release | DB hot-deployments, ratings and reviews features rollout on running website. |
