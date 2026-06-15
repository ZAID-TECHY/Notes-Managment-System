import jwt from "jsonwebtoken";
export async function authentication(req, resp , next) {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return resp.status(400).json({
                message: "token not found , go to login"
            })
        }
        const decoded = jwt.verify(token, process.env.jwt_secret);
        req.user = decoded;
        next();
    } catch (error) {
        resp.status(400).json({
            message: "Invalid or expired token",
            error: error.message
        })
    }

}