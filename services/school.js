const bcrypt = require("bcrypt");

const jwt = require("../utils/jwt");
const { School } = require("../models");


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

const updateSchoolProfile = async ({ user, name, numOfClasses, classesStart, classesEnd }) => {
    try {
        const school = await School.findOne({
            where: {
                createdBy: user.id
            }
        });
        
        const isNameRegisterd = school?.name != name ? await School.findOne({ where: { name } }) : null;

        if (isNameRegisterd) {
            return { code: 409 };
        }

        if (school) {
            await school.update({
                name,
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
                name,
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
    updateSchoolProfile
};
