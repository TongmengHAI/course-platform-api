const {users} = require('./user.data')


const createUser = (username, phone, password, role)=>{

    users.push({
        id:users.length+1,
        username:username,
        phone:phone,
        password:password,
        role:role
    })
    
    return true;
}

const updateUser = (id, username, phone, password, role)=>{

    const index = users.findIndex((u) => u.id == id);

    if (index === -1) {
        return null;
    }

    const updatedUser = {...users[index], username, phone, password, role};

    users[index] = updatedUser;

    return updatedUser;
}



module.exports = {createUser, updateUser};