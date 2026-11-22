const asyncHandler = require("express-async-handler");
const usermodel = require("../models/userModel");
const { generateToken } = require("../config/generateToken");
const { setAuthCookie } = require("../config/authCookie");
const { imageType } = require("../config/imageType");
const { requireId } = require("../utils/chatAccess");
const { deliveryUrl } = require("../config/avatarStorage");

const upload = require("../config/multer-config");
const userModel = require("../models/userModel");
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

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

  if (req.file && !imageType(req.file.buffer)) {
    res.status(400);
    throw new Error("Profile picture must be a PNG, JPEG, GIF or WebP image");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await findUserByEmail(normalizedEmail);

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
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
      return res.status(400).json({ message: "User already exists" });
    }
    throw error;
  }

  if (user) {
    let token = generateToken(user._id);
    setAuthCookie(res, token);

    req.user = user;
    return res.status(200).json({
      user: user,
      token: token,
    });
  } else {
    return res.status(400).json({ err: "user not found" });
  }
});

// runs ahead of the login limiter, which counts per account
const resolveLoginAccount = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    res.status(400);
    throw new Error("Please enter email and password");
  }

  req.loginUser = await findUserByEmail(email.trim());
  next();
});

const authUser = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = req.loginUser;

  if (user && (await user.matchPassword(password))) {
    let token=generateToken(user._id)
    setAuthCookie(res, token);

    
    req.user=user
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,

      token: token,

    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

const allUsers = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const keyword = search
    ? {
        $or: [
          { name: { $regex: escapeRegex(search), $options: "i" } },
          { email: { $regex: escapeRegex(search), $options: "i" } },
        ],
      }
    : {};

  const users = await userModel
    .find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .limit(50);
  res.send(users);
});

const getAvatar = asyncHandler(async (req, res) => {
  requireId(res, req.params.id, "user id");
  const user = await userModel.findById(req.params.id).select("+ProfilePic +avatarPublicId");
  if (user?.avatarPublicId && user.ProfilePic?.startsWith("https://")) {
    res.set("Cache-Control", "private, max-age=86400");
    return res.redirect(deliveryUrl(user.ProfilePic));
  }
  const image = Buffer.from(user?.ProfilePic || "", "base64");
  const type = imageType(image);

  // short cache for "no picture", so initials don't cost a request on every render
  res.set("Cache-Control", `private, max-age=${type ? 86400 : 300}`);
  if (!type) return res.sendStatus(204);

  res.set("X-Content-Type-Options", "nosniff");
  res.type(type).send(image);
});

module.exports = { registerUser, resolveLoginAccount, authUser, allUsers, getAvatar };
