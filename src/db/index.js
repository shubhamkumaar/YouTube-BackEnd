import mongoose from "mongoose";
import {DB_NAME} from "../constants.js"

const connectDB = async()=>{
    try{
        const Instance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected !! DB Host ${Instance.connection.host}`);
    }catch(err){
        console.log("MongoDB connection falied!",err);
        process.exit(1)
    }
    
}

export default connectDB