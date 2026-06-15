export default function authorization(roles) {
    return (req, res, next) => {
        const user = req.user.role;
        if (user && user.includes(roles)) {
            next()
        } else {
            res.status(403).json({
                message: "you are not allowed to visit that"
            })
        }
    }
}