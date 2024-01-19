const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log("pass is", process.env.GMAIL_PASS);
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      //   user: "beulah.sauer@ethereal.email",
      //   pass: "7HJWypQaGqaK2PVy5X",
      user: "qadeer@ccript.com",
      pass: "qmra cmvi wdsl dfgr",
    },
  });

  const mailOptions = {
    from: options.from,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
