const asyncHandler = require("express-async-handler");
const usermodel = require("../models/userModel");
const { generateToken } = require("../config/generateToken");

const upload = require("../config/multer-config");
const userModel = require("../models/userModel");
// exact match first, then ignore case for accounts saved with capitals
const findUserByEmail = async (email) =>
  (await userModel.findOne({ email })) ||
  (await userModel.findOne({ email }).collation({ locale: "en", strength: 2 }));

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const ProfilePic = req.file ? req.file.buffer.toString("base64") : undefined;

  if (
    [name, email, password].some((value) => typeof value !== "string") ||
    !name.trim() || !email.trim() || !password
  ) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await findUserByEmail(normalizedEmail);

  if (userExists) {
    return res.status(400).json({ err: "user already exists" });
  }

  let user;
  try {
    user = await userModel.create({
      name,
      email: normalizedEmail,
      password,
      ProfilePic,
    });
  } catch (error) {
    // another request registered the same email first
    if (error.code === 11000) {
      return res.status(400).json({ err: "user already exists" });
    }
    throw error;
  }

  if (user) {
    let token = generateToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, 
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      sameSite: "none", 
    });

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
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    res.status(400);
    throw new Error("Please enter email and password");
  }

  const user = await findUserByEmail(email.trim());

  if (user && (await user.matchPassword(password))) {
    let token=generateToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Only send cookie over HTTPS
      expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Expires in 2 days
      sameSite: "none", // Requires HTTPS and ensures cross-site request forgery (CSRF) protection
    });

    
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
