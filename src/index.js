// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: "./env"
})

connectDB()
.then(()=>{
    app.on("error",()=>{
        console.log("Error",err);
        throw err
    })
    app.listen(process.env.PORT || 3000,()=>{
        console.log(`Server is runnint on Port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDB connection failed !!!",err);
});