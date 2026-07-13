const users = [];

const findUserByEmail = (email) => {
    return users.find((user) => user.email === email);
};

const createUser = ({ name, email, password }) => {
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        role: "student"
    };
    users.push(newUser);
    return newUser;
};

const checkPassword = (user, password) => {
    return user.password === password;
};

module.exports = { findUserByEmail, createUser, checkPassword };
