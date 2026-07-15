# 🔐 Authentication — Zero to Completed

A step-by-step guide for building the authentication system of the **Online Course Platform**,
from an empty folder to a secure, production-ready login.

> **Stack:** Node.js · Express.js · MySQL · TypeORM
> **You will build:** `POST /auth/register` and `POST /auth/login`
> **You will learn:** layered architecture, validation, password hashing, JWT, protected routes.

---

## 📚 Table of Contents

1. [What is Authentication?](#1--what-is-authentication)
2. [The Big Picture (Request Flow)](#2--the-big-picture-request-flow)
3. [Project Architecture](#3--project-architecture)
4. [Prerequisites & Setup](#4--prerequisites--setup)
5. [Part A — Basic Auth (in-memory)](#part-a--basic-auth-in-memory)
6. [Part B — Real Database (MySQL + TypeORM)](#part-b--real-database-mysql--typeorm)
7. [Part C — Make It Secure (Hashing + JWT)](#part-c--make-it-secure-hashing--jwt)
8. [Part D — Protected Routes & Roles](#part-d--protected-routes--roles)
9. [Testing with Postman](#9--testing-with-postman)
10. [Reference Tables](#10--reference-tables)
11. [Common Errors & Fixes](#11--common-errors--fixes)
12. [Practice Exercises](#12--practice-exercises)
13. [Completion Checklist](#13--completion-checklist)

---

## 1. 🧠 What is Authentication?

**Authentication** answers one question: *"Who are you?"*
**Authorization** answers a different one: *"What are you allowed to do?"*

| Term | Question | Example |
|------|----------|---------|
| Authentication | Who are you? | Logging in with phone + password |
| Authorization | What can you do? | Only an `instructor` can create a course |

In this guide we build **authentication** first (register + login), then add
**authorization** (roles + protected routes) at the end.

---

## 2. 🔄 The Big Picture (Request Flow)

Every request travels through the same layers. Keep this diagram in your head:

```
Client (Postman / React)
        │  POST /auth/register  { username, phone, password }
        ▼
Express Server ──▶ Global Middleware (express.json, logger)
        │
        ▼
   Route  ──▶  Controller  ──▶  Service  ──▶  Database
 (auth.routes) (auth.controller) (auth.service)  (MySQL)
        │
        ▼
   JSON Response  { message, data }
```

**Golden rule of layers:**

- **Route** = *the address*. Maps a URL to a controller function.
- **Controller** = *request & response*. Reads `req.body`, validates, sends the reply.
- **Service** = *business logic*. Talks to the database. Knows nothing about `req`/`res`.

> Keeping business logic **out** of the controller is what makes code testable and reusable.

---

## 3. 🏗 Project Architecture

```
course-platform-api/
├── server.js                     # app entry point + middleware + route mounting
├── .env                          # secrets (DB password, JWT secret) — never commit
└── src/
    ├── configs/
    │   ├── database.js           # single MySQL DataSource
    │   └── security.js           # JWT secret / bcrypt rounds
    ├── middlewares/
    │   └── auth.js               # verifies the JWT on protected routes
    └── modules/
        ├── users/
        │   └── user.entity.js    # TypeORM model for the `users` table
        └── auth/
            ├── auth.routes.js     # POST /register, POST /login
            ├── auth.controller.js # validation + response
            └── auth.service.js    # DB access + password logic
```

---

## 4. ⚙ Prerequisites & Setup

### 4.1 Install dependencies

```bash
npm install express mysql2 typeorm reflect-metadata dotenv
# security add-ons (used in Part C)
npm install bcrypt jsonwebtoken
```

### 4.2 Create your `.env` file

```env
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=course_platform

# used in Part C
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d
```

> ⚠️ **Never commit `.env`.** Add it to `.gitignore`. Commit a `.env.example` with empty values instead.

### 4.3 Run the server

```bash
npm run dev     # node --watch server.js  → auto-restarts on save
npm start       # node server.js          → production run
```

---

## Part A — Basic Auth (in-memory)

> **Goal:** understand the flow with *zero* database. Data lives in a plain array and
> disappears on restart. This is the fastest way to see register/login working.

### Step A1 — The service (fake data + logic)

`src/modules/users/user.service.js`

```js
// Service = business logic layer. Temporary in-memory data.
// NOTE: when the server restarts, users disappear. Later we switch to MySQL.
const users = [];

const findUserByPhone = (phone) => {
    return users.find((user) => user.phone === phone);
};

const createUser = ({ username, phone, password }) => {
    const newUser = {
        id: users.length + 1,
        username,
        phone,
        password,
        role: "student",
    };
    users.push(newUser);
    return newUser;
};

const checkPassword = (user, password) => {
    return user.password === password;
};

module.exports = { findUserByPhone, createUser, checkPassword };
```

### Step A2 — The register controller (validate → check duplicate → create)

`src/modules/auth/auth.controller.js`

```js
// Controller = request & response layer. Keep business logic in the service.
const {
    findUserByPhone,
    createUser,
    checkPassword,
} = require("../users/user.service");

const register = (req, res) => {
    const { username, phone, password } = req.body;

    // 1) Validate required fields
    if (!username || !phone || !password) {
        return res.status(400).json({
            message: "Username, phone, and password are required",
        });
    }

    // 2) Reject duplicates
    const existingUser = findUserByPhone(phone);
    if (existingUser) {
        return res.status(400).json({ message: "Phone number already exists" });
    }

    // 3) Create the user
    const newUser = createUser({ username, phone, password });

    // 4) Return 201 + SAFE data (never send the password back)
    return res.status(201).json({
        message: "User registered successfully",
        data: {
            id: newUser.id,
            username: newUser.username,
            phone: newUser.phone,
            role: newUser.role,
        },
    });
};

module.exports = { register };
```

### Step A3 — The login controller (exist → password → success)

Add to the same `auth.controller.js`:

```js
const login = (req, res) => {
    const { phone, password } = req.body;

    // 1) Required fields
    if (!phone || !password) {
        return res.status(400).json({ message: "Phone and password are required" });
    }

    // 2) User must exist BEFORE checking the password
    const user = findUserByPhone(phone);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // 3) Wrong password → 401
    const isPasswordCorrect = checkPassword(user, password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid password" });
    }

    // 4) Success → safe user data (JWT token added in Part C)
    return res.status(200).json({
        message: "Login successful",
        data: {
            id: user.id,
            username: user.username,
            phone: user.phone,
            role: user.role,
        },
    });
};

module.exports = { register, login };
```

> 🔎 **Security detail:** we return the *same-ish* flow whether the user exists or the
> password is wrong. In real apps some teams return a generic "Invalid credentials" for
> both, so attackers can't tell which phone numbers are registered. We keep them separate
> here for teaching clarity.

### Step A4 — The routes

`src/modules/auth/auth.routes.js`

```js
const express = require("express");
const router = express.Router();

const { register, login } = require("./auth.controller");

// The prefix "/auth" comes from server.js.
router.post("/register", register); // POST http://localhost:5000/auth/register
router.post("/login", login);       // POST http://localhost:5000/auth/login

module.exports = router;
```

### Step A5 — Wire it into the server

`server.js`

```js
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const authRoutes = require("./src/modules/auth/auth.routes");

// express.json() lets controllers read req.body from JSON requests
app.use(express.json());

// logger: print every request before the final logic runs
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/auth", authRoutes);

app.listen(port, () => console.log(`Server running on port ${port}`));
```

✅ **Checkpoint:** run the server and hit `/auth/register` in Postman
([see Section 9](#9--testing-with-postman)). You now have working auth — but the data
vanishes on restart. Let's fix that.

---

## Part B — Real Database (MySQL + TypeORM)

> **Goal:** replace the in-memory array with a real `users` table. Only the **service**
> and the **entity** change. The controller and routes stay the same — that's the payoff
> of layering.

### Step B1 — Describe the table (the Entity)

`src/modules/users/user.entity.js`

```js
const { EntitySchema } = require("typeorm");

// In plain JS we use EntitySchema (decorators require TypeScript).
const User = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: { primary: true, type: "int", generated: true },
        username: { type: "varchar", length: 50 },
        phone: { type: "varchar", unique: true, length: 50 },
        password: { type: "varchar" },
        role: { type: "varchar", default: "student" },
    },
});

module.exports = { User };
```

Key ideas:
- `generated: true` → auto-increment id.
- `unique: true` on `phone` → the database itself blocks duplicates.
- `default: "student"` → new users are students unless told otherwise.

### Step B2 — Configure the database connection

`src/configs/database.js`

```js
require("reflect-metadata");
const { DataSource } = require("typeorm");
require("dotenv").config();

const { User } = require("../modules/users/user.entity");

const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "course_platform",
    synchronize: true, // auto-creates/updates tables from entities (DEV ONLY)
    entities: [User],
});

module.exports = { AppDataSource };
```

> ⚠️ `synchronize: true` is great for learning (the table is created for you) but
> **dangerous in production** — it can alter/drop columns. Real apps use *migrations*.

### Step B3 — Rewrite the service to use the database

`src/modules/auth/auth.service.js`

```js
const { AppDataSource } = require("../../configs/database");
const { User } = require("../users/user.entity");

// A repository is TypeORM's object for reading/writing one table.
const userRepository = () => AppDataSource.getRepository(User);

const findUserByPhone = async (phone) => {
    return userRepository().findOne({ where: { phone } });
};

const createUser = async ({ username, phone, password }) => {
    const newUser = userRepository().create({
        username,
        phone,
        password,
        role: "student",
    });
    return userRepository().save(newUser);
};

const checkPassword = (user, password) => {
    return user.password === password;
};

module.exports = { findUserByPhone, createUser, checkPassword };
```

> Notice these functions are now `async` (they hit the DB). So the controller must
> `await` them: `const existingUser = await findUserByPhone(phone);`. Update
> `auth.controller.js` — make `register`/`login` `async` and `await` every service call.

### Step B4 — Start the DB before the server

`server.js`

```js
require("reflect-metadata");
require("dotenv").config();

const express = require("express");
const app = express();
const port = process.env.PORT || 5000;

const { AppDataSource } = require("./src/configs/database");
const authRoutes = require("./src/modules/auth/auth.routes");

app.use(express.json());
app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });

app.use("/auth", authRoutes);

// Connect to the database FIRST, then start listening.
AppDataSource.initialize()
    .then(() => {
        console.log("✅ Database connected");
        app.listen(port, () => console.log(`Server running on port ${port}`));
    })
    .catch((error) => {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1);
    });
```

✅ **Checkpoint:** register a user, restart the server, then log in with the same
credentials. It works — the data survived because it's in MySQL now.

---

## Part C — Make It Secure (Hashing + JWT)

> ⚠️ **The code so far has two serious security holes:**
> 1. Passwords are stored as **plain text**. Anyone with DB access sees them.
> 2. Login returns no **token**, so the client can't prove it's logged in on the next request.
>
> This part fixes both. This is what "completed" really means.

### Step C1 — Hash passwords with bcrypt

Never store a real password. Store a one-way **hash**. bcrypt turns `"123456"` into
something like `$2b$10$N9qo8uLO...` that cannot be reversed.

`src/configs/security.js`

```js
const SALT_ROUNDS = 10;              // higher = slower = harder to brute force
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

module.exports = { SALT_ROUNDS, JWT_SECRET, JWT_EXPIRES_IN };
```

Update the service:

```js
const bcrypt = require("bcrypt");
const { SALT_ROUNDS } = require("../../configs/security");

const createUser = async ({ username, phone, password }) => {
    // Hash BEFORE saving
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = userRepository().create({
        username,
        phone,
        password: hashedPassword,
        role: "student",
    });
    return userRepository().save(newUser);
};

// Compare the plain password against the stored hash
const checkPassword = async (user, password) => {
    return bcrypt.compare(password, user.password);
};
```

> Because `checkPassword` is now `async`, update the login controller:
> `const isPasswordCorrect = await checkPassword(user, password);`

### Step C2 — Issue a JWT on login

A **JWT** (JSON Web Token) is a signed string the client stores and sends back on every
request. The server can verify it without a database lookup.

Create a helper (in `auth.service.js` or a small `token` util):

```js
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../../configs/security");

const generateToken = (user) => {
    // The "payload" — never put the password in here.
    return jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

module.exports = { findUserByPhone, createUser, checkPassword, generateToken };
```

Return it from the login controller on success:

```js
const token = generateToken(user);

return res.status(200).json({
    message: "Login successful",
    data: {
        token, // ⬅️ the client stores this (localStorage / httpOnly cookie)
        user: {
            id: user.id,
            username: user.username,
            phone: user.phone,
            role: user.role,
        },
    },
});
```

✅ **Checkpoint:** login now returns a `token`. Copy it — you'll need it next.

---

## Part D — Protected Routes & Roles

> **Goal:** some routes should only work for logged-in users, and some only for certain
> roles. This is **authorization**.

### Step D1 — The `auth` middleware (verify the token)

`src/middlewares/auth.js`

```js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs/security");

// Blocks the request unless a valid token is present.
const auth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }

    try {
        // Verified payload → attach to req so controllers know who's calling
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = { auth };
```

The client must send the token in the header:

```
Authorization: Bearer <the token from login>
```

### Step D2 — The `authorize` middleware (check the role)

```js
// Usage: authorize("instructor", "admin")
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission" });
    }
    next();
};

module.exports = { auth, authorize };
```

### Step D3 — Protect a route

```js
const { auth, authorize } = require("../../middlewares/auth");

// Any logged-in user:
router.get("/me", auth, getMyProfile);

// Only instructors or admins can create courses:
router.post("/courses", auth, authorize("instructor", "admin"), createCourse);
```

> **401 vs 403** — remember the difference:
> - **401 Unauthorized** = "I don't know who you are" (missing/invalid token).
> - **403 Forbidden** = "I know who you are, but you're not allowed."

---

## 9. 🧪 Testing with Postman

Set method to **POST**, Body → **raw** → **JSON**.

**Register** — `POST http://localhost:5000/auth/register`
```json
{
    "username": "Student A",
    "phone": "0176567014",
    "password": "123456"
}
```

**Login** — `POST http://localhost:5000/auth/login`
```json
{
    "phone": "0176567014",
    "password": "123456"
}
```

**Call a protected route** — add a header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## 10. 📋 Reference Tables

### HTTP status codes used in auth

| Code | Meaning | When we use it |
|------|---------|----------------|
| `200` | OK | Login success |
| `201` | Created | Register success |
| `400` | Bad Request | Missing fields / duplicate phone |
| `401` | Unauthorized | Wrong password / missing-invalid token |
| `403` | Forbidden | Logged in but wrong role |
| `404` | Not Found | User does not exist |
| `500` | Server Error | Unexpected crash (DB down, etc.) |

### Consistent response shape

Every endpoint returns the same envelope so the frontend can rely on it:

```json
{ "message": "human readable text", "data": { } }
```

### Endpoints

| Method | Path | Auth required | Purpose |
|--------|------|---------------|---------|
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Get a JWT token |
| GET | `/auth/me` | Yes | Current user's profile |

---

## 11. 🛠 Common Errors & Fixes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `req.body` is `undefined` | Missing `app.use(express.json())` | Add it **before** the routes |
| `ER_ACCESS_DENIED` on start | Wrong DB user/password | Check `.env` values |
| `ER_DUP_ENTRY ... phone` | Phone already registered | Expected — that's the unique constraint working |
| Password check always fails after adding bcrypt | Old plain-text rows in DB | Delete old users and re-register |
| `jwt malformed` | Sent the token without `Bearer ` prefix | Header must be `Authorization: Bearer <token>` |
| Login returns 404 for a real user | Comparing wrong field / typo in phone | Log the value; confirm the row exists |

---

## 12. ✍️ Practice Exercises

Work through these in order. Each builds on the last.

1. **Warm-up:** Add validation that the password must be at least 6 characters
   (return `400` otherwise).
2. **Duplicate username:** Currently only `phone` is unique. Decide whether `username`
   should be unique too, and enforce it.
3. **`GET /auth/me`:** Build a protected route that returns the logged-in user's profile
   using the `auth` middleware and `req.user.id`.
4. **Role guard:** Protect the "create course" route so only `instructor`/`admin` can use it.
5. **Refactor challenge:** Move `generateToken` into its own `src/utils/token.js` and
   import it where needed.
6. **Stretch:** Add a `POST /auth/logout` concept — discuss *why* stateless JWT makes
   real logout tricky, and what a refresh-token strategy would look like.

---

## 13. ✅ Completion Checklist

You have "completed" authentication when **all** of these are true:

- [ ] Register validates required fields and rejects duplicates
- [ ] Passwords are **hashed** with bcrypt — no plain text in the database
- [ ] Login returns a **JWT token** on success
- [ ] Passwords are **never** included in any response
- [ ] A protected route rejects requests without a valid token (`401`)
- [ ] A role-guarded route rejects the wrong role (`403`)
- [ ] Secrets (`JWT_SECRET`, DB password) live in `.env`, not in code
- [ ] Consistent `{ message, data }` response shape everywhere
- [ ] Tested end-to-end in Postman

---

> **Next module:** with auth in place, every other feature (enrollment, lessons,
> progress) can identify the user via `req.user` and enforce permissions with the same
> `auth` / `authorize` middleware you built here.
