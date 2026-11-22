const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel");
const { emitToUsers } = require("../socket");
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

module.exports = { updateName, updatePhoto };
