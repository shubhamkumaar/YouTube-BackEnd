import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfie, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "coverImage",
            maxCount: 1
        },
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)


// Secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-password").post(verifyJWT,changeCurrentPassword)
router.route("/update-details").patch(verifyJWT,updateAccountDetails)
router.route("/get-user").get(verifyJWT,getCurrentUser) 
router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfie)
router.route("/watch-history").get(verifyJWT,getWatchHistory)
export default router