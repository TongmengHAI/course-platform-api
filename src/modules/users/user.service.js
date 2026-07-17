const bcrypt = require("bcrypt");

const { SALT_ROUNDS } = require("../../configs/security");
const { AppDataSource } = require('../../configs/database');

const { User } = require('./user.entity');

const userRepo = () => AppDataSource.getRepository(User);

const findUserByEmail = async (email) => {
    return userRepo().findOne({ where: { email } });
};

const findUserByPhone = async (phone) => {
    return userRepo().findOne({ where: { phone } });
};


const creating = async ({ username, phone, password, role, email }) => {
    const repo = userRepo();
        // Hash BEFORE saving
    const hashedPassword = await bcrypt.hash(String(password), SALT_ROUNDS);

    const user = repo.create({
        username,
        phone,
        password: hashedPassword,
        role,
        email
    });
    return repo.save(user);
};


module.exports = { creating, findUserByEmail, findUserByPhone };