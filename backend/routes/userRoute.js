const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controllers/usercontrollers");
const { protect } = require("../middleware/Authmiddleware");
const upload = require("../config/multer-config");
const router = express.Router();

router
  .route("/")
  .post(upload.single("ProfilePic"), registerUser)
  .get(protect, allUsers);
router.post("/login", authUser);

router.get("/user", protect, (req, res) => {
  res.send(req.user);
});
router.route("/logout").get(protect, (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    sameSite: "none",
  });
  return res.send("logout succesfull");
});

module.exports = router;
