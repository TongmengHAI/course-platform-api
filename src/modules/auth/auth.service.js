const { users } = require('../users/user.data')

// business logic layer for auth (temporary in-memory data via user.data)

const findUserByPhone = (phone) => {
    return users.find((user) => user.phone === phone);
};

const createUser = ({ username, phone, password }) => {
    const newUser = {
        id: users.length + 1,
        username,
        phone,
        password,
        role: "student"
    };
    users.push(newUser);
    return newUser;
};

const checkPassword = (user, password) => {
    return user.password === password;
};

module.exports = { findUserByPhone, createUser, checkPassword };
