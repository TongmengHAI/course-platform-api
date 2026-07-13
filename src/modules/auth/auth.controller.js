const {
    findUserByEmail,
    createUser,
    checkPassword
} = require("../users/user.service");

const register = (req, res) => {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email, and password are required"
        });
    }

    // Check duplicate email
    const existingUser = findUserByEmail(email);
    if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
    }

    // Create user
    const newUser = createUser({ name, email, password });

    // Return status 201 and safe user data (no password)
    res.status(201).json({
        message: "User registered successfully",
        data: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    });
};

const login = (req, res) => {
    const { email, password } = req.body;

    // Email and password are required
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    // User must exist before password check
    const user = findUserByEmail(email);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Wrong password returns 401
    const isPasswordCorrect = checkPassword(user, password);
    if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid password" });
    }

    // Correct login returns safe user data (no password)
    // Later, this success response will include a JWT token.
    res.json({
        message: "Login successful",
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
};

module.exports = { register, login };
