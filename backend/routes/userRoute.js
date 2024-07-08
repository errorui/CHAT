const express=require('express')
const { registerUser,authUser,allUsers } = require('../controllers/usercontrollers');
const { protect } = require('../middleware/Authmiddleware');
const upload = require('../config/multer-config');
const router=express.Router();

router.route('/').post( upload.single('ProfilePic'), registerUser).get(protect,allUsers)
router.post("/login", authUser);

router.get('/user',protect,(req,res)=>{
   res.send(req.user)
})
router.route('/logout').get(protect,(req,res)=>{
   res.cookie("token","");
   return res.send("logout succesfull")
})


module.exports = router;