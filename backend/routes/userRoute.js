const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controllers/usercontrollers");
const { protect } = require("../middleware/Authmiddleware");
const upload = require("../config/multer-config");
const { clearAuthCookie } = require("../config/authCookie");
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
router.post("/login", authUser);

router.get("/user", protect, (req, res) => {
  res.send(req.user);
});
router.route("/logout").get((req, res) => {
  clearAuthCookie(res);
  return res.send("logout succesfull");
});

module.exports = router;
