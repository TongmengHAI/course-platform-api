const {users} = require('./user.data')

const listing = (req, res)=>{
    res.json({
        message: 'Users retrieved successfully',
        code: 200,
        data:users
    });
}

const creating = (req, res)=>{

    const newUser = req.body;

    if (!newUser || !newUser.username) {
        return res.status(999).json({
            message: 'username is required',
            code: 400,
            data: null
        });
    }

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

    // const id = Number(req.params.id);
    console.log(req.params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
        return res.status(404).json({
            message: 'User not found',
            code: 404,
            data: null
        });
    }

    res.json({
        message: 'User retrieved successfully',
        code: 200,
        data: user
    });
}


module.exports = { listing, creating, getById};
