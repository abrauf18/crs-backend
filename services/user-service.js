const bcrypt = require("bcrypt");

const jwt = require("../utils/jwt");
const { Op } = require("sequelize");
// @ts-ignore
const { User, School } = require("../models");
const { logger } = require("../Logs/logger.js");
const ROLES = require("../models/roles");


const getUserProfile = async ({ user }) => {
    try {

        let userData = {
            name: user.name,
            email: user.email,
            image: user.image
        };

        if (user.role === ROLES.SCHOOL) {
            const school = await School.findOne({
                where: {
                    id: user.school_id,
                },
                attributes: ["id", "name"],
                raw: true
            })
            if (!school) {
                return { code: 404, message: "School not Found" };
            }
            userData.schoolId = school.id;
            userData.schoolName = school.name;
        }

        return { code: 200, data: userData };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const updateUserProfile = async ({ user, image, name, email, password, schoolName }) => {
    try {
        const isEmailRegisterd = user.email != email ? await User.findOne({ where: { email } }) : null;

        if (isEmailRegisterd) {
            return { code: 409, message: "User with this email already exists, pleasy try another one" };
        }

        if (user.role === ROLES.SCHOOL) {
            const school = await School.findOne({
                where: {
                    id: user.school_id,
                },
                attributes: ["id", "name"],
            })
            if (!school) {
                return { code: 404, message: "School not Found" };
            }
            const existingSchool = await School.findOne({
                where: {
                    name: schoolName
                }
            })
            if (existingSchool && existingSchool.id !== school.id) {
                return { code: 409, message: "School with name already exists" };
            }
            await school.update({name: schoolName})
        }

        if (password != "") {
            await user.update({
                name,
                email,
                image,
                password,
            });
        } else {
            await user.update({
                name,
                email,
                image,
            });
        }

        const accessToken = jwt.generateAccessToken({
            email: email,
            userId: user.id,
        })

        user.save();

        return {
            code: 200,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                accessToken
            }
        };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getAllUsersProfile = async ({ user, page = 1, limit = 10, orderBy, sortBy, keyword, role }) => {
    try {
        const offset = (page - 1) * limit;

        const queryOptions = {
            attributes: ['id', 'name', 'email', 'role', 'image'],
            where: {
                [Op.not]: [{ id: user.id }],
            },
            offset,
            limit,
        };

        if (orderBy && sortBy) {
            queryOptions.order = [[orderBy, sortBy]];
        } else {
            queryOptions.order = [['id', 'ASC']];
        }

        if (keyword) {
            queryOptions.where[Op.or] = [
                { name: { [Op.like]: `%${keyword}%` } },
                { email: { [Op.like]: `%${keyword}%` } },
            ];
        }

        if (role) {
            queryOptions.where.role = role;
        }

        const usersData = await User.findAndCountAll(queryOptions);

        const res = {
            totalPages: Math.ceil(usersData.count / limit),
            totalUsers: usersData.count,
            users: usersData.rows,
        }
        return { code: 200, data: res };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const updateAnotherUsersProfile = async ({ userId, image, name, email, role }) => {
    try {
        const user = await User.findOne({ where: { id: userId } });

        const isEmailRegisterd = user.email != email ? await User.findOne({ where: { email } }) : null;

        if (isEmailRegisterd) {
            return { code: 409 };
        }

        await user.update({
            image,
            name,
            email,
            role
        });

        user.save();

        return {
            code: 200,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
            }
        };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const deleteAnotherUsersProfile = async ({ userId }) => {
    try {
        const user = await User.findOne({ where: { id: userId } });

        if (user) {
            const deletedUser = await user.destroy();

            return {
                code: 200,
                data: {
                    id: deletedUser.id,
                    name: deletedUser.name,
                    email: deletedUser.email,
                    image: deletedUser.image,
                    role: deletedUser.role,
                }
            }
        };

        return { code: 404 }
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getAllTeachers = async ({ user }) => {
    try {

        const teachers = await User.findAll({
            where: {
                [Op.and]: [
                    { role: ROLES.TEACHER },
                    { school_id: user?.dataValues?.school_id }
                ]
            },
            attributes: ['id', 'name', 'email', 'image']
        });
        return { code: 200, data: teachers };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    getAllUsersProfile,
    updateAnotherUsersProfile,
    deleteAnotherUsersProfile,
    getAllTeachers
};
