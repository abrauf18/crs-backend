const bcrypt = require("bcrypt");
const otpGenerator = require("otp-generator");
const jwt = require("../utils/jwt.js");
const { logger } = require("../Logs/logger.js");
const sendEmail = require("../utils/email.js");
const ROLES = require("../models/roles/index.js");
// @ts-ignore
const { User, School, Invite, OTP_code, Invite_token } = require("../models/index.js");
const { genericSignupInvitation, teacherInvitation, verficationOTP } = require("./helper/templates/index.js");

const inviteUser = async ({ name, email, role, user, schoolId }) => {
    try {

        if ((user.role == ROLES.SCHOOL && (role == ROLES.ADMIN || role == ROLES.SCHOOL))
            || (user.role == ROLES.TEACHER && (role == ROLES.ADMIN || role == ROLES.SCHOOL || role == ROLES.TEACHER))) {
            return { code: 403 };
        }

        const tokenPayload = { name, email, role };
        if (schoolId) {
            tokenPayload.schoolId = schoolId;
        }

        const token = jwt.generateAccessToken(tokenPayload);

        if (!token) {
            return { code: 500 };
        }

        const [InviteToken, created] = await Invite_token.findOrCreate({
            where: { email: email },
            defaults: { token: token, email: email, createdBy: user.id }
        });

        let invitation = InviteToken;

        if (!created) {
            const result = jwt.verifyAccessToken(InviteToken.token);
            if (result.success) {
                return { code: 409 };
            }

            const updatedInvite = await Invite_token.update({
                token: token,
                email: email,
                createdBy: user.id,
            }, {
                where: {
                    email: email
                },
                returning: true,
            });
            invitation = updatedInvite;
        }

        const html = genericSignupInvitation(name, role, token);

        await sendEmail({
            from: "CRS",
            email: email,
            subject: "Invitation from CRS",
            message: "",
            html,
        });

        return { code: 200, data: created ? invitation : invitation[1] };

    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const createInvitedUser = async ({ name, email, password, token }) => {
    try {

        const existingToken = await Invite_token.findOne({
            where: {
                token: token,
            },
        });

        if (!existingToken) {
            return { code: 400 };
        }

        const isEmailRegisterd = await User.findOne({ where: { email } });

        if (isEmailRegisterd) {
            return { code: 409 };
        }

        const result = jwt.verifyAccessToken(token);

        if (result.success) {
            const user = await User.create({
                name,
                email,
                // @ts-ignore
                role: result.decoded.role,
                // @ts-ignore
                school_id: result.decoded.schoolId,
                password,
            });

            if (user) {
                await existingToken.destroy();
                return { code: 200, data: user };
            }
        }
        else {
            if (result.error == "Token expired") {
                await existingToken.destroy();
                return { code: 403 };
            }
            else {
                return { code: 500 };
            }
        }
    }
    catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const createUser = async ({ name, password, email, role, schoolId }) => {
    try {
        const isEmailRegisterd = await User.findOne({ where: { email } });

        if (isEmailRegisterd) {
            return { code: 403 };
        }

        const user = await User.create({
            name,
            email,
            role,
            password,
            school_id: schoolId,
        });

        if (user) {
            return { code: 200, data: user };
        }
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided')
        return { code: 500 };
    }
};

const authenticateUser = async ({ email, password }) => {
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return { code: 404 };
        }

        // const result = await user.comparePassword(password)
        // if (result.error === true){
        //     return { code: 409 }
        // }
        if (!bcrypt.compareSync(password, user.password)) {
            return { code: 409 };
        }

        return { code: 200, data: user };
    } catch (error) {
        return { code: 500 };
    }
};

const createSchoolProfile = async ({
    schoolOwnerEmail,
    name,
    numberOfTeachers,
    studentsPopulation,
    courses,
}) => {
    try {
        const user = await User.findOne({ where: { email: schoolOwnerEmail } });

        if (!user) {
            return { code: 404 };
        }

        const school = await School.findOne({ where: { name: name } });

        if (school) {
            return { code: 403 };
        }

        const newSchool = await School.create({
            name: name,
            numberOfTeachers: numberOfTeachers,
            studentsPopulation: studentsPopulation,
            courses: courses,
            createdBy: user.id,
        });

        if (!newSchool) {
            return { code: 500 };
        }

        return { code: 200, data: newSchool };
    } catch (error) {
        return { code: 500 };
    }
};

const sendInviteToTeacher = async ({ schoolOwnerEmail, invites }) => {
    try {
        const user = await User.findOne({ where: { email: schoolOwnerEmail } });

        if (!user) {
            return { code: 404 };
        }

        const school = await School.findOne({ where: { createdBy: user.id } });

        if (!school) {
            return { code: 403 };
        }

        if (invites.length > school.numberOfTeachers) {
            return { code: 409 };
        }

        invites.map(async (invite) => {
            const html = teacherInvitation(school.name, invite.name);

            await sendEmail({
                from: school.name,
                email: invite.email,
                subject: "Invitation from School",
                message: "",
                html,
            });
        });

        const invitesSent = [];

        const invitesList = invites.map((invite) => ({
            name: invite.name,
            email: invite.email,
            createdBy: user.id,
        }));

        for (const invite of invitesList) {
            const [createdInvite, created] = await Invite.findOrCreate({
                where: { email: invite.email, createdBy: user.id },
                defaults: invite,
            });

            if (!created) {
                const updatedInvite = await Invite.update({
                    name: invite.name,
                    email: invite.email,
                    createdBy: user.id,
                }, {
                    where: {
                        email: invite.email,
                        createdBy: user.id,
                    },
                    returning: true,
                });
                invitesSent.push(updatedInvite[1]);
                continue;
            }

            invitesSent.push(createdInvite);
        }

        return { code: 200, data: invitesSent };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const sendOTP = async ({ email }) => {
    try {
        const user = await User.findOne({ where: { email: email } });

        if (!user) {
            return { code: 404 };
        }

        let OTP;
        let isOTPUsed;

        const existingRequest = await OTP_code.findOne({
            where: { userId: user.id },
        });

        if (existingRequest) {
            await existingRequest.destroy();
        }

        do {
            OTP = otpGenerator.generate(4, {
                digits: true,
                lowerCaseAlphabets: false,
                upperCaseAlphabets: false,
                specialChars: false,
            });

            isOTPUsed = await OTP_code.findOne({
                where: { otp: OTP },
            });

            if (isOTPUsed) {
                logger.info("OTP already registered, generating a new one.");
            }
        } while (isOTPUsed);

        const html = verficationOTP(user.name, OTP);

        await sendEmail({
            from: `CRS`,
            email: user.email,
            subject: "Reset Password Request",
            message: "",
            html,
        });

        await OTP_code.create({
            userId: user.id,
            otp: OTP,
        });

        return { code: 200, data: user };
    } catch (error) {
        console.error("Error while fulfilling request:", error);
        return { code: 500 };
    }
};

const verifyOTP = async ({ userId, OTP }) => {
    try {
        const forgotRequest = await OTP_code.findOne({
            where: {
                userId: userId,
                otp: OTP.toString(),
            },
        });

        if (!forgotRequest) {
            return { code: 400 };
        }

        // Remove record, after successful verification
        if (forgotRequest) {
            const currentDate = new Date();
            const createdAt = forgotRequest.createdAt;
            // @ts-ignore
            const timeDifference = currentDate - createdAt;
            const minutesDifference = timeDifference / (1000 * 60);
            const isWithinLast5Minutes = minutesDifference <= 5;

            if (isWithinLast5Minutes) {
                await forgotRequest.destroy();
            }
            else {
                return { code: 403 };
            }
        }
        return { code: 200, data: { userId: userId } };
    } catch (error) {
        logger.error(error?.message || 'An error occurred, but no error message was provided');
        return { code: 500 };
    }
};

const resetPassword = async ({ userId, newPassword }) => {
    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return { code: 404 }
        }

        user.password = newPassword;
        await user.save();

        return { code: 200 }
    } catch (error) {
        return { code: 500 }
    }
};

module.exports = {
    inviteUser,
    createInvitedUser,
    createUser,
    authenticateUser,
    createSchoolProfile,
    sendInviteToTeacher,
    sendOTP,
    verifyOTP,
    resetPassword
};
