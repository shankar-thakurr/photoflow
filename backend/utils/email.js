const nodemiler=require('nodemailer')

const sendEmail = async(options)=>{
    const transporter= nodemiler.createTransport({
        service:"Gmail",
        auth:{
            user:process.env.EMAIL,
            pass:process.env.EMAIL_PASSWORD
        }
    })
    const mainOption ={
        from: 'photoflow share your Imagination',
        to:options.email,
        subject:options.subject,
        html:options.html,
    }
    await transporter.sendMail(mainOption)
    return
}
module.exports = sendEmail;