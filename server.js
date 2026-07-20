require("reflect-metadata");
require("dotenv").config();

const { auth } = require("./src/middlewares/auth");
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

const { AppDataSource } = require("./src/configs/database");

const courseRoutes = require("./src/modules/courses/courses.routes");
const userRoutes = require("./src/modules/users/user.routes");
const authRoutes = require("./src/modules/auth/auth.routes");

app.use(express.json());

// middleware: log every request before the final logic runs
const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};
app.use(logger);

app.use("/courses", auth, courseRoutes);
app.use("/users", auth, userRoutes);
app.use("/auth", authRoutes);


// connect to DB first, then start the server
AppDataSource.initialize()
    .then(() => {
        console.log("✅ Database connected");
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    })
    .catch((error) => {
        console.error("❌ Database connection failed:", error.message);
        process.exit(1);
    });

// multer, npm install multer
