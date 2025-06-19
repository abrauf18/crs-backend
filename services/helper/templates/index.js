const ROLES = require("../../../models/roles");

const genericSignupInvitation = ( name, role, token ) => {
    const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Welcome to CRS</h2>
                <p>Dear ${name},</p>
                <p>You have received an invitation to join CRS as ${role == ROLES.ADMIN ? "an": "a"} ${role}.</p>
                <p>We are excited to welcome you to our educational platform!</p>
                <p>Please follow the instructions below to complete your registration:</p>
                
                <ol>
                    <li>Click on the following link to set up your account: ${process.env.BACKEND_URL}/${role === ROLES.SCHOOL ? 'school-signup' : 'signup'}?token=${token}</li>
                    <li>Create the password and use those credentials to login to your account.</li>
                    <li>Explore the features and resources available on CRS.</li>
                </ol>
        
                <p>If you have any questions or need assistance, feel free to contact us.</p>
        
                <p>Best regards,<br>CRS Team</p>
            </div>`;
    
    return html;
}

const teacherInvitation = ( schoolName, inviteName ) => {
    const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
                <h2>Welcome to ${schoolName}</h2>
                <p>Dear ${inviteName},</p>
                <p>You have received an invitation to join ${schoolName} as a teacher.</p>
                <p>We are excited to welcome you to our educational platform!</p>
                <p>Please follow the instructions below to complete your registration:</p>
                
                <ol>
                    <li>Click on the following link to set up your account: [Registration Link]</li>
                    <li>Create the password and use those credentials to login to your account.</li>
                    <li>Explore the features and resources available on ${schoolName}.</li>
                </ol>
        
                <p>If you have any questions or need assistance, feel free to contact us.</p>
        
                <p>Best regards,<br>${schoolName} Team</p>
            </div>`;
    
    return html;
}

const verficationOTP = ( userName, OTP ) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>Reset Password Request</h2>
            <p>Dear ${userName},</p>
            <p>We received a request to reset your password for your account at CRS.</p>
            <p>Your One-Time Password (OTP) for password reset is: <b>${OTP}</b></p>
            <p>Please use this OTP to verify your identity and reset your password.</p>
    
            <p>If you didn't request a password reset, please ignore this email.</p>
    
            <p>Best regards,<br>CRS</p>
        </div>`;
    
    return html;
}

module.exports = { teacherInvitation, verficationOTP, genericSignupInvitation }