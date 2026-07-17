const SALT_ROUNDS = 10;              // higher = slower = harder to brute force
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const JWT_EXPIRES_IN_MINUTES = process.env.JWT_EXPIRES_IN_MINUTES || "15";

module.exports = { SALT_ROUNDS, JWT_SECRET, JWT_EXPIRES_IN_MINUTES };