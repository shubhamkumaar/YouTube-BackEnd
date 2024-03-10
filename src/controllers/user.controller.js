import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res)=>{
    
    // get user details
    // validation -not empty
    // check if user exist
    // check for images
    // upload to cloudinary
    // create user object -create entry in DB
    // remove password and refresh token 
    // check for user response
    // return res

    const {fullName,email,username,password} = req.body 
    // console.log("email",email);

    if(
        [fullName,email,username,password].some((field)=>
            field?.trim() === ""
        )
    ){
        throw new ApiError(400,"All fields are required")
    }
    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"Username or email already exists.")
    }

    // console.log(req.files);
    // console.log(req.body);
    
    const avatarLocal = req.files?.avatar[0]?.path
    // console.log(avatarLocal);
    // const coverImageLocalPath = req.files['coverImage'][0]
    // console.log(coverImageLocalPath);
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
        console.log(coverImageLocalPath);
    }

    
    if(!avatarLocal){   
        throw new ApiError(400,"Avatar Image not found.")
    }
    // console.log("Img going to upload");
    const avatar = await uploadOnCloudinary(avatarLocal)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log("upload done");
    if(!avatar){
        throw new ApiError(400,"Avatar Image not found.")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select("-password -refreshToken")

    if(!userCreated){
        throw new ApiError(500,"Something went wrong while creating user")
    }

    return res.status(200).json(
        new ApiResponse(200,userCreated,"User registered Successfully.")
    )
})

export {registerUser}