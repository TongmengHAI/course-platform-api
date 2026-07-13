const { AppDataSource } = require('../../configs/database');
const { getPaginationParams, paginateQuery } = require("../../utils/pagination");
const {users} = require('./user.data');
const { User } = require('./user.entity');
const { createUser, updateUser} = require('./user.service')

const userRepo = () => AppDataSource.getRepository(User);


const getAllUsers = async (req, res) => {

    const { page, limit, skip } = getPaginationParams(req.query);

    const search = (req.query.search || "").trim();

    const role  = req.query.role;

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
        // .leftJoinAndSelect("user.instructor", "instructor")
        .where("user.isDeleted = :isDeleted", { isDeleted: false });
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
const creating = (req, res)=>{

    // const newUser = req.body;
    const {username, phone, password, role} = req.body;

    if (!username) {
        return res.status(999).json({
            message: 'username is required',
            code: 400,
            data: null
        });
    }

    const newUser = createUser(username, phone, password, role)

    return res.json({
        message: 'User created successfully',
        code: 200,
        data: users
    });
}

const getById = (req, res)=>{

    const id = Number(req.params.id);
    const user = users.find((u) => u.id == id);

    if (!user) {
        return res.status(404).json({
            message: 'User not found',
            code: 404,
            data: null
        });
    }

    res.json({
        message: 'User retrieved successfully',
        code: 200,
        data: user
    });
}

const updated = (req, res)=>{

    // const newUser = req.body;
    const id = Number(req.params.id);
    const {username, phone, password, role} = req.body;

    if (!username) {
        return res.status(999).json({
            message: 'username is required',
            code: 400,
            data: null
        });
    }

    const newUser = updateUser(id, username, phone, password, role)

    if (!newUser) {
        return res.status(404).json({
            message: 'User not found',
            code: 404,
            data: null
        });
    }

    return res.json({
        message: 'User updated successfully',
        code: 200,
        data: newUser
    });
}


module.exports = { getAllUsers, creating, getById, updated};
