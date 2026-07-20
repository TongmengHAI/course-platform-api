const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../../configs/security");

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

const generateToken = (user) => {
    // The "payload" — never put the password in here.
    console.log("JWT_EXPIRES_IN", JWT_EXPIRES_IN);
    return jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

module.exports = { creating, findUserByEmail, findUserByPhone, generateToken };