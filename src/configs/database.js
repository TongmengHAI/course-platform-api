require("reflect-metadata");
const { DataSource } = require("typeorm");
require("dotenv").config();

const { User } = require("../modules/users/user.entity");
const { Course } = require("../modules/courses/course.entity");

// Single DataSource for the whole app.
// synchronize: true auto-creates/updates tables from entities (dev only).
const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "course_platform",
    
    synchronize: false, // true auto-creates/updates tables from entities (dev only)
    // logging: false,
    entities: [User, Course],
});

module.exports = { AppDataSource };
