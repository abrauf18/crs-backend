const bcrypt = require("bcrypt");

const jwt = require("../utils/jwt");
// @ts-ignore
const { User, School } = require("../models");
const {logger} = require("../Logs/logger.js");
const { updateUserProfile } = require("./user-service.js");


const getSchoolProfile = async ({ user }) => {
    try {
        
        const schoolData = await School.findOne({
            where: {
                createdBy: user.id
            }
        });

        return { code: 200, data: schoolData };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const updateSchoolAndUserProfile = async ({ user, image, username, email, password, schoolName, numOfClasses, classesStart, classesEnd }) => {
    try {

        const updateUser = await updateUserProfile({user, image, name: username, email, password});

        if (updateUser.code != 200) {
            return updateUser;
        }

        const school = await School.findOne({
            where: {
                createdBy: user.id
            }
        });
        
        const isNameRegisterd = school?.name != schoolName ? await School.findOne({ where: { name: schoolName } }) : null;

        if (isNameRegisterd) {
            return { code: 403 };
        }

        if (school) {
            await school.update({
                name: schoolName,
                numOfClasses,
                classesStart,
                classesEnd,
            });

            return {
                code: 200,
                data: {
                    school,
                },
            };
        } else {
            const newSchool = await School.create({
                name: schoolName,
                numOfClasses,
                classesStart,
                classesEnd,
                createdBy: user.id,
            });

            return {
                code: 200,
                data: {
                    school: newSchool,
                },
            };
        }

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const getAllSchools = async () => {
    try {
        const schools = await School.findAll({
            attributes: ['id', 'name'],
        })

        return { code: 200, data: schools };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

module.exports = {
    getSchoolProfile,
    updateSchoolAndUserProfile,
    getAllSchools,
};
