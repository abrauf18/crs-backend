const bcrypt = require("bcrypt");

const jwt = require("../utils/jwt");
const { User } = require("../models");
const logger = require("../Logs/logger.js");


const getUserProfile = async ({ user }) => {
    try {
        
        const userData = {
            name: user.name,
            email: user.email,
            image: user.image
        };

        return { code: 200, data: userData };

    } catch (error) {
        logger.error("error: ", error);
        return { code: 500 };
    }
};

const updateUserProfile = async ({ user, image, name, email, password }) => {
    try {
        const isEmailRegisterd = user.email != email ? await User.findOne({ where: { email } }) : null;

        if (isEmailRegisterd) {
            return { code: 409 };
        }

        if (password != "") {
            const hashedPassword = bcrypt.hashSync(password, 10);
            await user.update({
                name, 
                email,
                image,
                password: hashedPassword,
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
        logger.error("error: ", error);
        return { code: 500 };
    }
};


module.exports = {
    getUserProfile,
    updateUserProfile
};
