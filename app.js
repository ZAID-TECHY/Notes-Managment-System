import express from "express";
import cors from "cors";
import userRoutes from "./Routes/userroutes.js";
import notesRoutes from "./Routes/notesroutes.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const server = express();
server.use(express.json()); 
server.use(cors());
mongoose.connect(process.env.MONGO_URL)//process.env.MONGO_URI
  .then(() => console.log("Database connection successful"))
  .catch((err) => console.error("Database connection failed:", err));

server.use("/",userRoutes);
server.use("/notes" , notesRoutes);


const PORT = process.env.PORT || 4900;
server.listen(PORT,console.log("Server started"));