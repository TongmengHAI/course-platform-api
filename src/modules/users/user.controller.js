const { AppDataSource } = require('../../configs/database');
const { getPaginationParams, paginateQuery } = require("../../utils/pagination");
const { User } = require('./user.entity');
const { creating } = require('./user.service')

const userRepo = () => AppDataSource.getRepository(User);


const getAllUsers = async (req, res) => {

    const { page, limit, skip } = getPaginationParams(req.query);

    const search = (req.query.search || "").trim();

    const role = req.query.role;

    // Sort: sortBy=field, order=ASC|DESC
    const allowedSortFields = ["id", "username", "phone", "role"];
    const sortBy = allowedSortFields.includes(req.query.sortBy)
        ? req.query.sortBy
        : "id";
    const order = String(req.query.order).toUpperCase() === "ASC" ? "ASC" : "DESC";
    // asc = ascending order, desc = descending order
    // ---- Build the query ----

    const qb = userRepo()
        .createQueryBuilder("user")
        .where("user.is_deleted = :isDeleted", { isDeleted: false });
    if (search) {
        qb.andWhere(
            "(user.username LIKE :search OR user.phone LIKE :search)",
            { search: `%${search}%` }
        );
    }

    // sort
    qb.orderBy(`user.${sortBy}`, order);

    // Applies skip/take + getManyAndCount, returns { data, pagination }
    const { data, pagination } = await paginateQuery(qb, { page, limit, skip });

    res.json({
        message: "Users retrieved successfully",
        data,
        pagination,
    });
};


// request/ validation/ response 
const createUser = async (req, res) => {
    const { username, phone, password, role, email } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }
    if (!password) {
        return res.status(400).json({ message: "Password is required" });
    }
    if (!role) {
        return res.status(400).json({ message: "Role is required" });
    }

    const existingUser = await userRepo().findOneBy({ email: email, phone: phone, is_deleted: false });
    if (existingUser) {
        return res.status(400).json({ message: "Email or phone already exists" });
    }

    const data = await creating({ username, phone, password, role, email });

    res.status(201).json({ message: "User created successfully", data });
};

const getUserById = async (req, res) => {
    const userId = Number(req.params.id);

    const user = await userRepo().findOneBy({ id: userId, is_deleted: false });

    if (!user) return res.status(404).json({ message: "User not found!" });

    res.json({ message: "User retrieved successfully", data: user });
};

// res.body 
// res.params
// res.query

const getUserByEmail = async (req, res) => {
    const emailVal = String(req.query.email).trim();
    const user = await userRepo().findOneBy({ email: emailVal, is_deleted: false });

    if (!user) return res.status(404).json({ message: "User not found!" });

    res.json({ message: "User retrieved successfully", data: user });
};

const updateUser = async (req, res) => {
    const userId = Number(req.params.id);
    const { username, email, phone, password, role } = req.body;

    const repo = userRepo();
    const user = await repo.findOneBy({ id: userId, is_deleted: false });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Only overwrite fields that were actually provided.
    if (username !== undefined) user.username = username;
    if (email !== undefined && email !== user.email) user.email = email;
    if (phone !== undefined && phone !== user.phone) user.phone = phone;
    if (password !== undefined ) user.password = password;
    if (role !== undefined) user.role = role;

    const existingUser = await userRepo().findOneBy({ email: email, phone: phone, is_deleted: false });
    if (existingUser) {
        return res.status(400).json({ message: "Email or phone already exists" });
    }

    const data = await repo.save(user);

    res.json({ message: "User updated successfully", data });
};


// @desc Soft delete a course
const softDeleteUser = async (req, res) => {
    const userId = Number(req.params.id);

    const repo = userRepo();
    const user = await repo.findOneBy({ id: userId, is_deleted: false });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.is_deleted = true;

    await repo.save(user);

    res.json({ message: "User deleted successfully", data: null });
};

module.exports = { getAllUsers, createUser, getUserById, getUserByEmail, updateUser, softDeleteUser };
