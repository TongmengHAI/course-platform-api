const { AppDataSource } = require("../../configs/database");
const { User } = require("../users/user.entity");

// business logic layer for auth (now backed by MySQL via TypeORM)
const userRepository = () => AppDataSource.getRepository(User);

const findUserByPhone = async (phone) => {
    return userRepository().findOne({ where: { phone } });
};

const createUser = async ({ username, phone, password }) => {
    const newUser = userRepository().create({
        username,
        phone,
        password,
        role: "student"
    });
    return userRepository().save(newUser);
};

const checkPassword = (user, password) => {
    return user.password === password;
};

module.exports = { findUserByPhone, createUser, checkPassword };
