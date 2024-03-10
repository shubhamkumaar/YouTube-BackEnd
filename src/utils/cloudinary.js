import {v2 as cloudinary} from "cloudinary";
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY, 
  api_secret: process.env.CLOUD_API_SECRET 
});


const uploadOnCloudinary = async (localPath)=>{
    try{
        // console.log("cloudinary.");
        if(!localPath) return null

        // console.log("cloud upload is going to happen");

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })

        // File uploaded
        // console.log("File Uploaded on cloudinary",response)
        fs.unlinkSync(localPath)
        return response
    }catch(err){
        fs.unlinkSync(localPath)// remove the file locally saved temp file on server
        return null
    }
}

export{uploadOnCloudinary}