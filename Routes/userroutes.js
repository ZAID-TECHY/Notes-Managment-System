import express from "express";
import { authentication } from "../../Backend/mddleware/authentication.js";
import { login , register , logout ,getProfile } from "../Controller/user,controller.js";
const userRoutes= express.Router();
userRoutes.post("/register" ,register );
userRoutes.post("/login" , login);
userRoutes.post("/logout",logout);
userRoutes.get("/profile" , authentication , getProfile );
export default userRoutes;