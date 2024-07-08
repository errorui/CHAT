const asyncHandler = require("express-async-handler");
const usermodel = require("../models/userModel");
const { generateToken } = require("../config/generateToken");

const upload = require("../config/multer-config");
const userModel = require("../models/userModel");
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const ProfilePic = req.file ? req.file.buffer.toString("base64") : null;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  const userExists = await userModel.findOne({ email });

  if (userExists) {
    return res.status(400).json({ err: "user already exists" });
  }

  const user = await userModel.create({
    name,
    email,
    password,
    ProfilePic,
  });

  if (user) {
    let token = generateToken(user._id);
    res.cookie("token", token, { httpOnly: true });
    req.user = user;
    return res.status(200).json({
      user: user,
      token: token,
    });
  } else {
    return res.status(400).json({ err: "user not found" });
  }
});

const authUser = asyncHandler(async (req, res) => {

  const { email, password } = req.body;
   console.log("login")

  const user = await usermodel.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    let token=generateToken(user._id)
    res.cookie("token",token,{httpOnly:true})
    req.user=user
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: token,

    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await userModel.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

module.exports = { registerUser, authUser,allUsers };
