import User from "../../Backend/model/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export async function register(req, resp) {
    try {
        const { name, email, password, role } = req.body;
        const userexist = await User.findOne({email });
        if (userexist) {
            return resp.status(400).json({
                message: "User already exist"
            })
        }
        const hashpassword = await bcrypt.hash(password, 10);
        const data = await User.create({
            name: name,
            email: email,
            password: hashpassword,
            role: role
        })
        if (!data) {
            return resp.status(400).json({
                message: "user not created"
            })
        }
        resp.status(200).json({
            message: "User created succesfully",
            data: data
        })
    } catch (error) {
        resp.status(400).json({
            message: "error is " + error
        })
    }

}

export async function login(req, resp) {
    try {
        const { email, password } = req.body;
        const userexist = await User.findOne({ email: email });
        if (!userexist) {
            return resp.status(400).json({
                message: "No user exist"
            })
        }
        const userpassword = userexist.password;
        const data = await bcrypt.compare(password, userpassword);
        if (!data) {
            return resp.status(400).json({
                message: "wrong password"
            })
        } else {
            const token = jwt.sign(
                { id: userexist._id, role: userexist.role },
                process.env.jwt_secret,
                { expiresIn: "1d" }
            )
            resp.status(200).json({
                token,
                name: userexist.name,
                role: userexist.role,
                message: "logged in succesfully"
            })
        }
    } catch (error) {
        resp.status(400).json({
            message: "error id" + error
        })
    }
}

export const logout = async (req, res) => {
    try {
        // Inform the client application that it can safely clear its local storage
        res.status(200).json({
            success: true,
            message: "Logged out successfully. Please clear your token from the client storage."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message
        });
    }
};

export async function getProfile(req, resp) {
    const id = req.user.id;
    const profile = await User.findById(id);
    if (!profile) {
        return resp.status(400).json({
            message: "No user exist"
        })
    }
    resp.status(200).json({
        message : "user found succesfully",
        profile : profile
    })
}