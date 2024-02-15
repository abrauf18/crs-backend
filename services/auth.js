const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");
const otpGenerator = require("otp-generator");
const sendEmail = require("../utils/email.js");
const { User, School, Invite, OTP_code } = require("../models");
const { teacherInvitation, verficationOTP } = require("./helper/emailTemplates/index.js");

const createUser = async ({ name, password, email, role }) => {
    try {
        const isEmailRegisterd = await User.findOne({ where: { email } });

        if (isEmailRegisterd) {
            return { code: 403 };
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = await User.create({
            name,
            email,
            role,
            password: hashedPassword,
        });

        if (user) {
            return { code: 200, data: user };
        }
    } catch (error) {
        console.log(error)
        return { code: 500 };
    }
};

const authenticateUser = async ({ email, password }) => {
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return { code: 404 };
        }

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
        console.log("error: ", error);
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
                console.log("OTP already registered, generating a new one.");
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
            await forgotRequest.destroy();
        }
        return { code: 200, data: { userId: userId } };
    } catch (error) {
        return { code: 500 };
    }
};

const resetPassword = async ({ userId, newPassword }) => {
    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return { code: 404 }
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return { code: 200 }
    } catch (error) {
        return { code: 500 }
    }
};

module.exports = {
    createUser,
    authenticateUser,
    createSchoolProfile,
    sendInviteToTeacher,
    sendOTP,
    verifyOTP,
    resetPassword
};
