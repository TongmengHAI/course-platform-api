const express = require('express');
const app = express();
const port = 5000;

const courseRoutes = require("./src/modules/courses/courses.routes");
app.use("/courses", courseRoutes);

// url = http://localhost:5000 = http:://127.0.0.1:5000

// url + course route: http://localhost:5000 = http:://127.0.0.1:5000/courses/


app.get('/courses',(req, res) => {
    res.json({ message: "Courses retrieved successfully", data: courses });
})

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