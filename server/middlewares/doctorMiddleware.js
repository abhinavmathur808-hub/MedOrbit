
const doctorMiddleware = (req, res, next) => {
    if (req.userRole !== 'doctor') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Doctor only.',
        });
    }
    next();
};

export default doctorMiddleware;
