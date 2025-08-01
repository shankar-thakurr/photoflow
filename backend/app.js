const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const globalErrorHandler = require("./controllers/errorController");
const userRoutes = require("./routes/userRoutes");
const path = require("path");
const appError = require("./utils/appError");

const app = express();

app.use('/',express.static("uploads"));

app.use(helmet());
app.use(mongoSanitize());
app.use(cookieParser());

app.use(cors({
    origin:[ 'http://localhost:3000'],
    credentials:true,
}));


app.use(express.static(path.join(__dirname, "public")));
if(process.env.NODE_ENV === "development"){
    app.use(morgan("dev"));
}

app.use(express.json({limit:"10kb"}));
app.use(express.urlencoded({extended:true, limit:"10kb"}));

// routes fro users
app.use('/api/users',userRoutes)

// routes for posts

app.all("*", (req,res,next)=>{
    next(new appError(`Can't find ${req.originalUrl} on this server!`,404));
});
app.use(globalErrorHandler);
module.exports = app;