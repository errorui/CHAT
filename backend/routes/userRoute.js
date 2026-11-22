const express = require("express");
const {
  registerUser,
  resolveLoginAccount,
  authUser,
  allUsers,
  getAvatar,
} = require("../controllers/usercontrollers");
const { protect } = require("../middleware/Authmiddleware");
const { updateName } = require("../controllers/profileController");
const upload = require("../config/multer-config");
const { clearAuthCookie } = require("../config/authCookie");
const { limitLoginPerClient, limitLoginPerAccount } = require("../middleware/loginLimiter");
const { generateSocketToken } = require("../config/generateToken");
const router = express.Router();

// a bad upload is the client's mistake, not a server error
const receiveAvatar = (req, res, next) =>
  upload.single("ProfilePic")(req, res, (err) => {
    if (err) res.status(400);
    next(err);
  });

router
  .route("/")
  .post(receiveAvatar, registerUser)
  .get(protect, allUsers);
router.post("/login", resolveLoginAccount, limitLoginPerClient, limitLoginPerAccount, authUser);

router.get("/user", protect, (req, res) => {
  res.send(req.user);
});
router.patch("/user", protect, updateName);
router.get("/socket-token", protect, (req, res) => {
  res.json({ token: generateSocketToken(req.user._id) });
});
router.get("/:id/avatar", protect, getAvatar);
router.route("/logout").get((req, res) => {
  clearAuthCookie(res);
  return res.send("logout succesfull");
});

module.exports = router;
