const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");
const otpGenerator = require("otp-generator");
const sendEmail = require("../utils/email.js");
const { User, School, Invite, ForgotPasswordRequest } = require("../models");

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

        console.log("user:", user.dataValues);

        if (user) {
            return { code: 200, data: user };
        }
    } catch (error) {
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
        return res
            .status(500)
            .json({ status: "error", message: "Internal Server Error" });
    }
};

const decodeAuthCookie = async (req, res, next) => {
    try {
        authcookie = req.cookies.authcookie;

        const { email, userId } = jwt.verifyAccessToken(authcookie);

        req.email = email;
        req.userId = userId;

        next();
    } catch (error) {
        return res
            .status(401)
            .json({ status: "error", message: "Invalid credentials" });
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

        invites.map(async (invite) => {
            const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Welcome to ${school.name}</h2>
                <p>Dear ${invite.name},</p>
                <p>You have received an invitation to join ${school.name} as a teacher.</p>
                <p>We are excited to welcome you to our educational platform!</p>
                <p>Please follow the instructions below to complete your registration:</p>
                
                <ol>
                    <li>Click on the following link to set up your account: [Registration Link]</li>
                    <li>Create the password and use those credentials to login to your account.</li>
                    <li>Explore the features and resources available on ${school.name}.</li>
                </ol>
        
                <p>If you have any questions or need assistance, feel free to contact us.</p>
        
                <p>Best regards,<br>${school.name} Team</p>
            </div>`;
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
                console.log("updated invite: ", updatedInvite[1]);
                invitesSent.push(updatedInvite);
                continue;
            }

            invitesSent.push(createdInvite);
        }

        // for (const invite of invitesList) {
        //     const [instance, created] = await Invite.upsert({
        //         name: invite.name,
        //         email: invite.email,
        //         createdBy: user.id,
        //     });

        //     console.log(instance)

        //     if (!created) {
        //         console.log(
        //             `Invite with email ${invite.email} already exists. Ignoring.`
        //         );
        //         continue;
        //     }

        //     createdInvites.push(instance);
        // }

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

        const existingRequest = await ForgotPasswordRequest.findOne({
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

            isOTPUsed = await ForgotPasswordRequest.findOne({
                where: { otp: OTP },
            });

            if (isOTPUsed) {
                console.log("OTP already registered, generating a new one.");
            }
        } while (isOTPUsed);

        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>Reset Password Request</h2>
            <p>Dear ${user.name},</p>
            <p>We received a request to reset your password for your account at CRS.</p>
            <p>Your One-Time Password (OTP) for password reset is: <b>${OTP}</b></p>
            <p>Please use this OTP to verify your identity and reset your password.</p>
    
            <p>If you didn't request a password reset, please ignore this email.</p>
    
            <p>Best regards,<br>CRS</p>
        </div>`;

        await sendEmail({
            from: `CRS`,
            email: user.email,
            subject: "Reset Password Request",
            message: "",
            html,
        });

        await ForgotPasswordRequest.create({
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
        const forgotRequest = await ForgotPasswordRequest.findOne({
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
    decodeAuthCookie,
    createSchoolProfile,
    sendInviteToTeacher,
    sendOTP,
    verifyOTP,
    resetPassword
};
