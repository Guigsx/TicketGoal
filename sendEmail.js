const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "guilhermeschmitzguii@gmail.com",
        pass: "sawz rscn unxl jeol",
    },
})

const sendEmail = async (mailOptions) => {
    try {
        console.log('Enviando email...');
        await transporter.sendMail(mailOptions)
        console.log('Email enviado!');
    } catch (error) {
        console.log('Houve algum erro...');
        console.log(error);
    }
}

module.exports = sendEmail;