const express = require('express');
const app = express();
const port = 5000;

// routes
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// req = request, res = response
app.get('/health', (req, res) => {
    console.log('Get data from form param: '+req.query.name); // form data pass by params
    res.send('good!');
});

app.get('/book/:id', (req, res) => {
    console.log('Get data from route param: '+req.params.id);  // 
    res.send('Book!')
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});