# Online Course Platform ERD

This is a simple Entity Relationship Diagram (ERD) for an online course platform.

You can copy the DBML code below and paste it into [dbdiagram.io](https://dbdiagram.io/) to generate the diagram.

---

## Main Tables

- `roles`
- `users`
- `categories`
- `courses`
- `sections`
- `lessons`
- `enrollments`
- `lesson_progress`

---

## DBML Code

```dbml
Project online_course_platform {
  database_type: "MySQL"
}

/* =========================
   USER MANAGEMENT
   ========================= */

Table roles {
  id int [pk, increment]
  name varchar(50) [not null, unique]
  created_at timestamp
}

Table users {
  id int [pk, increment]
  role_id int [not null]
  name varchar(100) [not null]
  email varchar(255) [not null, unique]
  password varchar(255) [not null]
  created_at timestamp
}

/* =========================
   COURSE MANAGEMENT
   ========================= */

Table categories {
  id int [pk, increment]
  name varchar(100) [not null]
  slug varchar(100) [not null, unique]
}

Table courses {
  id int [pk, increment]
  category_id int [not null]
  instructor_id int [not null]
  title varchar(200) [not null]
  description text
  price decimal(10,2)
  status varchar(20) [not null, note: "draft or published"]
  created_at timestamp
}

/* =========================
   COURSE CONTENT
   ========================= */

Table sections {
  id int [pk, increment]
  course_id int [not null]
  title varchar(200) [not null]
  sort_order int
}

Table lessons {
  id int [pk, increment]
  section_id int [not null]
  title varchar(200) [not null]
  content text
  content_url varchar(255)
  sort_order int
}

/* =========================
   LEARNING ACTIVITY
   ========================= */

Table enrollments {
  id int [pk, increment]
  user_id int [not null]
  course_id int [not null]
  enrolled_at timestamp

  indexes {
    (user_id, course_id) [unique]
  }
}

Table lesson_progress {
  id int [pk, increment]
  user_id int [not null]
  lesson_id int [not null]
  is_completed boolean
  completed_at timestamp

  indexes {
    (user_id, lesson_id) [unique]
  }
}

/* =========================
   RELATIONSHIPS
   ========================= */

Ref: users.role_id > roles.id

Ref: courses.category_id > categories.id
Ref: courses.instructor_id > users.id

Ref: sections.course_id > courses.id
Ref: lessons.section_id > sections.id

Ref: enrollments.user_id > users.id
Ref: enrollments.course_id > courses.id

Ref: lesson_progress.user_id > users.id
Ref: lesson_progress.lesson_id > lessons.id
```

---

## Relationship Summary

### Roles and Users

One role can belong to many users.

```text
roles 1 ----- many users
```

Examples of roles:

- Student
- Instructor
- Admin

---

### Instructor and Courses

One instructor can create many courses.

```text
users 1 ----- many courses
```

The `instructor_id` in the `courses` table refers to the instructor in the `users` table.

---

### Categories and Courses

One category can contain many courses.

```text
categories 1 ----- many courses
```

Example:

```text
Category: Web Development

Courses:
- HTML and CSS
- React Beginner
- Node.js Backend
```

---

### Course Content Structure

A course contains sections, and a section contains lessons.

```text
Course
  └── Section
        └── Lesson
```

Example:

```text
React Beginner
  └── Introduction to React
        ├── What is React?
        ├── Install Node.js
        └── Create a React Project
```

---

### Students and Courses

A student can enroll in many courses, and a course can have many students.

This is a many-to-many relationship implemented through the `enrollments` table.

```text
users many ----- enrollments ----- many courses
```

The unique key below prevents the same student from enrolling in the same course more than once:

```dbml
(user_id, course_id) [unique]
```

---

### Lesson Progress

The `lesson_progress` table records whether a student has completed a lesson.

```text
users many ----- lesson_progress ----- many lessons
```

The unique key below ensures that one student has only one progress record for each lesson:

```dbml
(user_id, lesson_id) [unique]
```

---

## Primary Keys

Every table has an `id` column as its primary key.

Example:

```dbml
id int [pk, increment]
```

- `pk` means primary key.
- `increment` means the value increases automatically.

---

## Foreign Keys

Foreign keys connect one table to another.

Examples:

```text
users.role_id          -> roles.id
courses.category_id    -> categories.id
courses.instructor_id  -> users.id
sections.course_id     -> courses.id
lessons.section_id     -> sections.id
```

---

## Suggested Teaching Order

1. Create the `roles` table.
2. Create the `users` table.
3. Create the `categories` table.
4. Create the `courses` table.
5. Create the `sections` table.
6. Create the `lessons` table.
7. Create the `enrollments` table.
8. Create the `lesson_progress` table.
9. Add and explain the relationships.
10. Paste the DBML code into dbdiagram.io.
