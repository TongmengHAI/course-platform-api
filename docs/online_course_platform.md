# Online Course Platform + Admin Dashboard
Software Requirement Specification


# 🌟 Project Vision

The Online Course Platform aims to provide an accessible, scalable, and modern learning environment where students can enroll in courses, track learning progress, and interact with structured educational content. The platform also empowers instructors and administrators to manage educational resources efficiently through centralized dashboards.

---

# 📌 Project Scope

## Included in MVP
- Authentication and authorization
- Course management
- Enrollment system
- Lesson and section management
- Learning progress tracking
- Instructor dashboard
- Admin dashboard
- REST API architecture
- Deployment to production

## Excluded from MVP
- Online payment gateway
- Live streaming
- Real-time chat
- AI recommendation engine
- Certificate generation

---

# 📘 Project Overview

This project is a fullstack web application where users can browse, enroll, and learn courses online. The system includes three main user roles:

- Student
- Instructor
- Admin

The project serves as the main reference architecture for the bootcamp. Students will practice software engineering concepts through this shared system and later apply the same architecture principles to their own domain-specific projects.

---

# 🎯 Project Objectives

By completing this project, students should be able to:

- Build a fullstack web application from scratch
- Design and consume REST APIs
- Work with relational databases (MySQL)
- Implement authentication and authorization
- Apply real-world business logic
- Collaborate using Git and GitHub
- Structure scalable frontend and backend applications
- Deploy applications to production

---

# 🧱 Technology Stack

## Frontend
- React.js
- Tailwind CSS

## Backend
- Node.js
- Express.js

## Database
- MySQL

## Development Tools
- Git & GitHub
- Postman
- VS Code

---

# 🧩 Shared Engineering Concepts

This project follows the same engineering principles practiced throughout the bootcamp.

Students are expected to implement:

- Authentication (JWT)
- Authorization & Role-Based Access
- RESTful API Architecture
- CRUD Operations
- Database Relationships
- Protected Routes
- Form Validation
- Dashboard Systems
- Responsive UI Design
- Git & GitHub Workflow
- Production Deployment

Although student projects may use different business domains, the software engineering structure remains consistent across all bootcamp projects.

---

# 🏗 System Architecture Concept

## Frontend Architecture
```
src/
├── components/
├── pages/
├── layouts/
├── services/
├── routes/
├── hooks/
└── utils/
```

## Backend Architecture
```
backend/
├── utils/
├─ configs/ # Global configuration (Type)
│  ├── database.js
│  └── security.js
├─ middleware/ # Global middlewares (Type)
│  ├── auth.js
│  └── errorHandler.js
└─ modules/
    ├─ users/
    │ ├─ user.controller.js
    │ ├─ user.service.js
    │ └─ user.routes.js
    └─ courses/
    │  ├─ course.controller.js
    │  ├─ course.data.js
    │  └─ course.routes.js
```
---

# 👥 User Roles & Permissions

## 1. Student

The student is the primary learner of the platform.

Responsibilities:
- Register and login
- Browse courses
- Enroll in courses
- Access lessons
- Track learning progress

## 2. Instructor

The instructor manages educational content.

Responsibilities:
- Create courses
- Edit and delete courses
- Manage sections and lessons
- Publish and unpublish courses
- Monitor enrolled students

## 3. Admin

The administrator manages the entire platform.

Responsibilities:
- Manage users
- Manage courses
- Approve or disable content
- Monitor platform statistics
- Manage system operations

---

# 📦 Core Modules

## 🔐 Authentication System
- User registration
- User login
- Password hashing
- JWT authentication
- Protected routes
- Role-based access control

## 📚 Course Management
- Create course
- Edit course
- Delete course
- Course categories
- Course detail page

## 🎓 Enrollment System
- Enroll in course
- Prevent duplicate enrollment
- View enrolled courses

## 📖 Learning Module
- Course → Section → Lesson structure
- Lesson viewing page
- Mark lesson as completed
- Learning progress tracking

## 👨‍🏫 Instructor Dashboard
- Manage courses
- Manage lessons
- Publish course
- Track enrollments

## 🛠 Admin Dashboard
- Manage users
- Manage courses
- View statistics
- Moderate content

---

# ⚙ Functional Requirements

The system must:

- Allow users to register and authenticate
- Allow instructors to manage courses
- Allow students to enroll in courses
- Track lesson completion progress
- Provide role-based access control
- Provide dashboard management features

---

# 🛡 Non-Functional Requirements

The system should:

- Be responsive on mobile and desktop
- Maintain secure password storage
- Handle invalid input gracefully
- Follow clean UI/UX principles
- Support modular and scalable architecture
- Provide maintainable code structure

---

# 🗄 Database Requirements

Main tables:
- users
- roles
- courses
- categories
- enrollments
- sections
- lessons
- lesson_progress
- course_reviews

Key relationships:
- One-to-many (User → Courses)
- One-to-many (Course → Sections)
- One-to-many (Section → Lessons)
- Many-to-many (Users ↔ Courses via Enrollments)

---

# 🔌 API Requirements

## Authentication APIs
- POST /auth/register
- POST /auth/login

## Course APIs
- GET /courses
- GET /courses/:id
- POST /courses
- PUT /courses/:id
- DELETE /courses/:id

## Enrollment APIs
- POST /enrollments
- GET /my-courses

## Lesson APIs
- GET /lessons/:id
- POST /progress

---

# 🎨 Frontend Requirements

Required pages:
- Home Page
- Course List Page
- Course Detail Page
- Login Page
- Register Page
- Student Dashboard
- Instructor Dashboard
- Admin Dashboard

UI Requirements:
- Responsive design
- Clean layout
- Reusable components
- Consistent styling

---

# 🔒 Security Requirements

- Passwords must be hashed
- Protected routes require authentication
- Role-based access must be enforced
- JWT tokens must be validated
- Sensitive data must not be exposed

---

# 🔄 Development Workflow

Students should follow:

1. Create feature branch
2. Develop feature
3. Commit with meaningful message
4. Push to GitHub
5. Create pull request
6. Review and merge

---

# 🧹 Coding Standards

Students should:

- Use meaningful variable names
- Keep components reusable
- Separate business logic from UI
- Avoid duplicated code
- Follow consistent folder naming
- Write clean and readable code

---

# 🚀 Deployment Requirements

Frontend:
- Vercel / Netlify

Backend:
- Railway / Render / VPS 

Database:
- Railway MySQL / PlanetScale / Local MySQL

Students must:
- Use environment variables
- Connect production database
- Test production deployment

---

# 🧪 Testing Requirements

Students should:
- Test APIs using Postman
- Validate user input
- Handle errors properly
- Test authentication flow
- Test responsive layouts

---

# 📊 Evaluation Criteria

Students will be evaluated based on:

- Code quality
- Feature completeness
- Database design
- Team collaboration
- GitHub activity
- Final presentation

---

# 🏁 Final Deliverables

Each team must submit:

- GitHub repository
- Live deployed project URL
- Database schema (SQL file)
- Final presentation
- README documentation

---

# 📅 Timeline & Milestones

## Milestone 1 (Week 1–3)
Frontend prototype complete
- UI pages
- Routing
- Components
- Forms

## Milestone 2 (Week 4–6)
Backend + database + authentication complete
- REST API
- MySQL schema
- JWT login
- Role-based access

## Milestone 3 (Week 7–9)
Main platform features complete
- Enrollment
- Lessons
- Progress tracking
- Instructor dashboard

## Milestone 4 (Week 10–12)
Admin + deployment + presentation complete
- Admin dashboard
- Final integration
- Production deployment

---

# 🚀 Future Improvements

Possible future enhancements:
- Online payment integration
- Video streaming
- Certificate generation
- Discussion forum
- Real-time notifications
- AI course recommendations

---

# 🎯 Final Goal

By the end of this project, students should be able to confidently build and deploy scalable fullstack web applications and apply the same engineering principles to real-world software systems.
