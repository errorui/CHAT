const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel");
const { emitToUsers } = require("../socket");
const { findUserByEmail } = require("./usercontrollers");
const { imageType } = require("../config/imageType");
const { storeAvatar, deleteAvatar } = require("../config/avatarStorage");

const MAX_NAME_LENGTH = 80;

// everyone sharing a chat with them shows their name and picture
const announceProfile = async (req, user) => {
  const chats = await chatModel.find({ users: user._id }).select("users").lean();
  const audience = new Set([String(user._id), ...chats.flatMap((chat) => chat.users.map(String))]);
  emitToUsers(req.app.get("io"), [...audience], "profile changed", {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatarVersion: user.avatarVersion,
  });
};

const updateName = asyncHandler(async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name || name.length > MAX_NAME_LENGTH) {
    res.status(400);
    throw new Error(`Name must be 1 to ${MAX_NAME_LENGTH} characters`);
  }

  const user = await userModel.findByIdAndUpdate(req.user._id, { $set: { name } }, { new: true });
  await announceProfile(req, user);
  res.json(user);
});

// returns the picture that was replaced, atomically so simultaneous uploads leave no orphans
const replacePicture = (userId, fields) =>
  userModel
    .findByIdAndUpdate(userId, { $set: { ...fields, avatarVersion: Date.now() } }, { new: false })
    .select("+avatarPublicId");

const updatePhoto = asyncHandler(async (req, res) => {
  if (!req.file || !imageType(req.file.buffer)) {
    res.status(400);
    throw new Error("Profile picture must be a PNG, JPEG, GIF or WebP image");
  }

  const photo = await storeAvatar(req.file.buffer);
  let previous;
  try {
    previous = await replacePicture(req.user._id, photo);
  } catch (error) {
    await deleteAvatar(photo.avatarPublicId);
    throw error;
  }
  await deleteAvatar(previous?.avatarPublicId);

  const user = await userModel.findById(req.user._id);
  await announceProfile(req, user);
  res.json(user);
});

const removePhoto = asyncHandler(async (req, res) => {
  const previous = await replacePicture(req.user._id, { ProfilePic: "", avatarPublicId: "" });
  await deleteAvatar(previous?.avatarPublicId);

  const user = await userModel.findById(req.user._id);
  await announceProfile(req, user);
  res.json(user);
});

// anything that changes how you sign in needs the current password
const confirmPassword = async (req, res, password) => {
  const user = await userModel.findById(req.user._id);
  if (typeof password !== "string" || !password || !(await user.matchPassword(password))) {
    res.status(403);
    throw new Error("Your current password is wrong");
  }
  return user;
};

const updateEmail = asyncHandler(async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^\S+@\S+$/.test(email)) {
    res.status(400);
    throw new Error("Enter a valid email address");
  }
  await confirmPassword(req, res, req.body.password);

  const owner = await findUserByEmail(email);
  if (owner && !owner._id.equals(req.user._id)) {
    res.status(400);
    throw new Error("That email is already in use");
  }

  let user;
  try {
    user = await userModel.findByIdAndUpdate(req.user._id, { $set: { email } }, { new: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    res.status(400);
    throw new Error("That email is already in use");
  }
  await announceProfile(req, user);
  res.json(user);
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof newPassword !== "string" || !newPassword) {
    res.status(400);
    throw new Error("Choose a new password");
  }

  const user = await confirmPassword(req, res, currentPassword);
  user.password = newPassword; // hashed by the pre save hook
  await user.save();
  res.json({ message: "Password changed" });
});

module.exports = { updateName, updatePhoto, removePhoto, updateEmail, updatePassword };
