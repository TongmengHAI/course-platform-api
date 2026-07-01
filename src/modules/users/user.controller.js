const {users} = require('./user.data')
const { createUser, updateUser} = require('./user.service')

const listing = (req, res)=>{
    res.json({
        message: 'Users retrieved successfully',
        code: 200,
        data:users
    });
}

// request/ validation/ response 
const creating = (req, res)=>{

    // const newUser = req.body;
    const {username, phone, password, role} = req.body;

    if (!username) {
        return res.status(999).json({
            message: 'username is required',
            code: 400,
            data: null
        });
    }

    const newUser = createUser(username, phone, password, role)

    return res.json({
        message: 'User created successfully',
        code: 200,
        data: users
    });
}

const getById = (req, res)=>{

    const id = Number(req.params.id);
    const user = users.find((u) => u.id == id);

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

const updated = (req, res)=>{

    // const newUser = req.body;
    const id = Number(req.params.id);
    const {username, phone, password, role} = req.body;

    if (!username) {
        return res.status(999).json({
            message: 'username is required',
            code: 400,
            data: null
        });
    }

    const newUser = updateUser(id, username, phone, password, role)

    if (!newUser) {
        return res.status(404).json({
            message: 'User not found',
            code: 404,
            data: null
        });
    }

    return res.json({
        message: 'User updated successfully',
        code: 200,
        data: newUser
    });
}


module.exports = { listing, creating, getById, updated};
