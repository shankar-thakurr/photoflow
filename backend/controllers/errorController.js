module.exports = (err, req, res, next) => {
    err.status= err.statusCode || 500;
    err.status=err.status || "error"
    res.status(err.status).json({
        status: err.status,
        message: err.message,
        stack:err.stack
    });
};