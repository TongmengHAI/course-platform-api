const { creating } = require('../users/user.service');
const { findUserByPhone, findUserByEmail } = require('../users/user.service');
const { checkPassword } = require('./auth.service')

// controller = request & response layer

const register = async (req, res) => {
    const { username, phone, password, email } = req.body;

    // validate required fields
    if (!username || !phone || !password || !email) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    // check duplicate
    const existingPhone = await findUserByPhone(phone);
    if (existingPhone) {
        return res.status(400).json({ message: "Phone number already exists" });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
    }

    const role = "student"; // default role for new users
    // create user
    // const newUser = await creating(u_name, phoneNumber, password, role, email);
    const newUser = await creating({ username, phone, password, email, role });

    // do not return password in response data
    return res.status(201).json({
        message: "User registered successfully",
        data: {
            id: newUser.id,
            username: newUser.username,
            phone: newUser.phone,
            email: newUser.email,
            role: newUser.role
        }
    });
};

const login = async (req, res) => {
    const { phone, password } = req.body;

    // phone and password are required
    if (!phone || !password) {
        return res.status(400).json({ message: "Phone and password are required" });
    }

    // user must exist before password check
    const user = await findUserByPhone(phone);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // wrong password returns 401
    const isPasswordCorrect = checkPassword(user, password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid password" });
    }

    // correct login returns safe user info (no password)
    return res.status(200).json({
        message: "Login successful",
        data: {
            id: user.id,
            username: user.username,
            phone: user.phone,
            role: user.role
        }
    });
};

module.exports = { register, login };
