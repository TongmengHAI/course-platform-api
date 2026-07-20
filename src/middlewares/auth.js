const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../configs/security");

// Blocks the request unless a valid token is present.
const auth = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please login first" });
    }

    try {
        // Verified payload → attach to req so controllers know who's calling
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Usage: authorize("instructor", "admin")
const authorize = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission" });
    }
    next();
};


module.exports = { auth, authorize };