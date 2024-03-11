import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()   
        const accessToken =  user.generateAccessToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    }catch(err){
        throw new ApiError(500,"something went wrong while generating refresh and access token.")
    }
}




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

const loginUser = asyncHandler(async(req,res)=>{
    // req body
    // username or email
    // find user
    // check password
    // access and refresh token
    // send cookie
    
    const {email,username,password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or password is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist.")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials.")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )
    // .cookie("accessToken",accessToken,options)
    // .cookie("refreshToken",refreshToken,options)
    // .json(
    //     new ApiResponse(200,
    //         {
    //             user:loggedInUser,accessToken,refreshToken
    //         },
    //         "user logged in successfully."            
    //     )
    // )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out Successfully"))
})


const refreshAccessToken = asyncHandler(async(req,res)=>{
    try {
        const incomingToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingToken){
            throw new ApiError(401,"unaurthorized request")
        }
        const decodedToken = jwt.verify(
            incomingToken,process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(user?.refreshToken !== incomingToken){
            throw new ApiError(401,"Refresh token is Expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res.status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",refreshToken)
        .json(
            new ApiResponse(200,{ accessToken , refreshToken},"Access Token refreshed")
        )       
    } catch (error) {
        throw new ApiError(401,"Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPassword = await user.isPasswordCorrect(oldPassword)

    if(!isPassword){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async(req,res) =>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName , email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Account Details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req,res) =>{
    const avatarLocalPath = req.file?.path
    // console.log(req.file);
    // Deleting old image
    const oldUser = await User.findById(req.user?._id)
    const oldAvatar = oldUser.avatar
    // console.log(oldAvatar);
    
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
         },
        {new :true}
    ).select("-password")
    await deleteOnCloudinary(oldAvatar)
    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar changed successfully")
    )

})

const updateUserCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
         },
        {new :true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverImage changed successfully")
    )

})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}