const nodemailer = require('nodemailer')
const config = require('./config.json')

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: config.email,
        pass: config.password,
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