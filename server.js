const express = require('express');
const app = express();
const port = 5000;

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

app.use("/courses", courseRoutes);
app.use("/users", userRoutes);
app.use("/auth", authRoutes);


// entry point
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// multer, npm install multer