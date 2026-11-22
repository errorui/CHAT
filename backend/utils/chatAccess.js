const { isObjectIdOrHexString } = require("mongoose");
const chatModel = require("../models/chatModel");

const isValidId = (value) => typeof value === "string" && isObjectIdOrHexString(value);

const requireId = (res, value, label) => {
  if (!isValidId(value)) {
    res.status(400);
    throw new Error(`Invalid ${label}`);
  }
};

// 404 rather than 403, so outsiders can't tell which chats exist
const getMemberChat = async (req, res, chatId) => {
  requireId(res, chatId, "chat id");
  const chat = await chatModel.findById(chatId);
  if (!chat || !chat.users.some((id) => id.equals(req.user._id))) {
    res.status(404);
    throw new Error("Chat Not Found");
  }
  return chat;
};

const getMemberGroup = async (req, res, chatId) => {
  const chat = await getMemberChat(req, res, chatId);
  if (!chat.isGroupChat) {
    res.status(400);
    throw new Error("Not a group chat");
  }
  return chat;
};

const getAdminGroup = async (req, res, chatId) => {
  const chat = await getMemberGroup(req, res, chatId);
  if (!chat.groupAdmin?.equals(req.user._id)) {
    res.status(403);
    throw new Error("Only the group admin can do that");
  }
  return chat;
};

module.exports = { isValidId, requireId, getMemberChat, getMemberGroup, getAdminGroup };
