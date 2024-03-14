const bcrypt = require("bcrypt");

const jwt = require("../utils/jwt");
const { School } = require("../models");
const { updateUserProfile } = require("./user");


const getSchoolProfile = async ({ user }) => {
    try {
        
        const schoolData = await School.findOne({
            where: {
                createdBy: user.id
            }
        });

        return { code: 200, data: schoolData };

    } catch (error) {
        console.log("error: ", error);
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
        console.log("error: ", error);
        return { code: 500 };
    }
};


module.exports = {
    getSchoolProfile,
    updateSchoolAndUserProfile,
};
