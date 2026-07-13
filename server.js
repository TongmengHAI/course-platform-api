const express = require('express');
const app = express();
const port = 5000;

const courseRoutes = require("./src/modules/courses/courses.routes");
const authRoutes = require("./src/modules/auth/auth.routes");

// express.json(): parse incoming JSON bodies so controllers can read req.body
app.use(express.json());

// logger middleware: log every request before the final logic runs
const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};
app.use(logger);

// Routes
app.use("/courses", courseRoutes);      // http://localhost:5000/courses/
app.use("/api/auth", authRoutes);       // http://localhost:5000/api/auth/register | /login

// url = http://localhost:5000 = http:://127.0.0.1:5000

// url + course route: http://localhost:5000 = http:://127.0.0.1:5000/courses/

// // routes
// app.get('/', (req, res) => {
//     res.send('Hello World!');
// });

// // req = request, res = response
// app.get('/health', (req, res) => {
//     console.log('Get data from form param: '+req.query.name); // form data pass by params
//     res.send('good!');
// });

// app.get('/book/:id', (req, res) => {
//     console.log('Get data from route param: '+req.params.id);  // 
//     res.send('Book!')
// });


// entry point
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});