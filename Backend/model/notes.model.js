import mongoose from "mongoose";
const NotesSchema = new mongoose.Schema({
    writer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title:{
        type : String,
        required : true
    },
    content:{
        type : String,
        required : true
    },
    timeofcreation : {
        type : Date
    },
    lastchange : {
        type : Date
    }
} ,{ timestamps: true })
const Notes = mongoose.model("Notes",NotesSchema)
export default Notes;