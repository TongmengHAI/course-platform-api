const express = require('express');
const app = express();
const port = 5000;

const courseRoutes = require("./src/modules/courses/courses.routes");
const userRoutes = require("./src/modules/users/user.routes");

app.use(express.json());

app.use("/courses", courseRoutes);
app.use("/users", userRoutes);


// entry point
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});