
const bcrypt = require("bcrypt");
// const { SALT_ROUNDS } = require("../../configs/security");


const checkPassword = async (user, password) => {
    // return user.password === bcrypt.hash(String(password), SALT_ROUNDS);
    return bcrypt.compareSync(String(password), user.password);
};

module.exports = { checkPassword };
