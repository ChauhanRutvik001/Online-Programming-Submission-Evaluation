import User from "../models/user.js";
import { StatusCodes } from "http-status-codes";
import { NotFoundError } from "../utils/errors.js";
import { createToken } from "../utils/jwt.js";
import { GridFSBucket } from "mongodb";
import { mongoose } from "../app.js";

export const updateUser = async (req, res) => {
  try {
    console.log("update api called");
    const {
      username,
      gender,
      location,
      birthday,
      github,
      skills,
      education,
      linkedIn,
      name,
      bio,
      email,
    } = req.body;

    // console.log(req.body);

    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Ensure username and name are not empty strings
    if (!username?.trim() || !name?.trim()) {
      return res.status(400).json({
        message: "Username and profile name cannot be empty.",
        success: false,
      });
    }

    user.username = username;
    user.profile.name = name;
    user.email = email;
    user.profile = Object.assign(user.profile, {
      bio,
      gender,
      location,
      birthday,
      github,
      skills,
      education,
      linkedIn,
    });

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        username: user.username,
        profile: user.profile,
        email: user.email,
      },
      success: true,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const uploadProfilePic = async (req, res) => {
  console.log("API is hit");

  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!userId || !file || !file.id) {
      return res
        .status(400)
        .json({ error: "User ID and valid file are required." });
    }

    console.log("Uploading avatar for user:", userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { "profile.avatar": file.id } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({
      message: "Avatar uploaded successfully.",
      fileId: file.id,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture." });
  }
};

export const getProfilePic = async (req, res) => {
  console.log("API hit OK");

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const fileId = user.profile?.avatar;
    if (!fileId) {
      return res.status(404).json({ error: "Profile picture not found." });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: "Invalid file ID." });
    }

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    const fileStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(fileId)
    );

    res.set("Content-Type", "image/jpeg");

    fileStream.on("error", (error) => {
      console.error("Error streaming profile picture:", error);
      if (!res.headersSent) {
        return res
          .status(500)
          .json({ error: "Error retrieving profile picture." });
      }
    });

    fileStream.on("end", () => {
      console.log("Profile picture stream completed.");
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("Error fetching profile picture:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error." });
    }
  }
};

export const removeProfilePic = async (req, res) => {
  console.log("removeProfilePic API called");

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User does not exist." });
    }

    const fileId = user.profile?.avatar;
    if (!fileId) {
      console.log("Avatar not found");
      return res.status(404).json({ message: "Avatar does not exist." });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      console.log("Invalid file ID");
      return res.status(400).json({ message: "Invalid file ID." });
    }

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    // await new Promise((resolve, reject) => {
    //   bucket.delete(new mongoose.Types.ObjectId(fileId), (err) => {
    //     if (err) {
    //       console.error("Error removing avatar:", err);
    //       reject(err);
    //     } else {
    //       resolve();
    //     }
    //   });
    // });

    await bucket.delete(new mongoose.Types.ObjectId(fileId));

    user.profile.avatar = null;
    await user.save();

    console.log("Avatar removed successfully.");
    res.status(200).json({ message: "Avatar removed successfully." });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    res.status(500).json({ message: "Server error." });
  }
};
