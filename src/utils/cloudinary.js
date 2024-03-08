import {v2 as cloudinary} from "cloudinary";
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY, 
  api_secret: process.env.CLOUD_API_SECRET 
});


const uploadOnCloudinary = async (localPath)=>{
    try{
        if(!localPath) return null

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localPath,{
            resource_type:"auto"
        })

        // File uploaded
        console.log("File Uploaded on cloudinary",response.url)
    }catch(err){
        fs.unlinkSync(localPath)// remove the file locally saved temp file on server
    }
}

export{uploadOnCloudinary}