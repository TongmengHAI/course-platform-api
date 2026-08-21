
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { AppDataSource } = require("../../configs/database");
const { RefreshToken } = require("./refresh-token.entity");

const tokenRepo = () => AppDataSource.getRepository(RefreshToken);


const checkPassword = async (user, password) => {
    return bcrypt.compareSync(String(password), user.password);
};


// 1. Generate & save token to DB
const createRefreshToken = async (userId) => {
    const token = crypto.randomBytes(20).toString("hex");

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const repo = tokenRepo();
    const refreshToken = repo.create({
        token,
        expiresAt,
        user: { id: userId }
    });

    await repo.save(refreshToken);
    return token;
};

// 2. Validate token and return associated User
const verifyRefreshToken = async (tokenString) => {
    const repo = tokenRepo();
    const token = await repo.findOne({
        where: { token: tokenString },
        relations: { user: true } // TypeORM v0.3 object relations syntax
    });

    if (!token) return null;

    // Validate expiration date
    if (new Date() > new Date(token.expiresAt)) {
        await repo.remove(token);
        return null;
    }

    return token.user;
};

// 3. Revoke (delete) token from DB on logout
const revokeRefreshToken = async (tokenString) => {
    const repo = tokenRepo();
    const token = await repo.findOneBy({ token: tokenString });
    if (token) {
        await repo.remove(token);
    }
};

module.exports = { checkPassword, createRefreshToken, verifyRefreshToken, revokeRefreshToken };
