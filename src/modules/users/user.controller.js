// const users = require('./user.data')

const listing = (req, res)=>{
    res.json({
        message: 'Users retrieved successfully',
        code: 200,
        data:users
    });
}

const users = [];

const creating = (req, res)=>{

    const newUser = req.body;
    users.push({
        id:users.length+1,
        username:newUser.username,
        phone:newUser.phone,
        password:newUser.password,
        role:newUser.role
    })

    return res.json({
        message: 'User created successfully',
        code: 200,
        data: users
    });
}

const getById = (req, res)=>{

    const id = req.param;
    console.log(id);
    

    res.json({
        message: 'Users retrieved successfully',
        code: 200,
        data:users
    });
}


module.exports = { listing, creating, getById};
