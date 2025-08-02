const dotenv = require('dotenv');
dotenv.config({path:"./config.env"});
const app = require('./app');
const mongoose = require("mongoose");


process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});


const port = process.env.PORT || 3000;

mongoose
    .connect(process.env.DB)
    .then(()=>{
    try {
          mongoose.connect(process.env.DB);
           console.log(`Connection to DB is Success${mongoose.connection.host}`);
     } catch (error) {
        console.log("DB Error", error)
    }
})

// Routes

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

process.on("unhandledRejection", (err, promise) => {
    console.log("UNHANDLED REJECTION! Shutting down...");
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});