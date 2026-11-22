const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
const userSchema=mongoose.Schema({
    name: { type: "String", required: true },
    email: { type: "String", unique: true, required: true },
    password: { type: "String", required: true },
    ProfilePic: {
      type: String, 
       
      default: "",
      select: false, // can be megabytes, only the avatar route loads it
    },
    // a login token only works while this matches the one it was signed with
    tokenVersion: { type: Number },
    // changes with the picture, so cached avatar urls are replaced
    avatarVersion: { type: Number },
    // set when ProfilePic is a cloudinary url rather than base64
    avatarPublicId: { type: String, select: false },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
},{
  timestamps:true,
  toJSON: {
    // never send the password hash to clients
    transform(doc, ret) {
      delete ret.password;
      delete ret.ProfilePic;
      delete ret.avatarPublicId;
      delete ret.tokenVersion;
      return ret;
    },
  },
})
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
const userModel=mongoose.model("user",userSchema);
module.exports=userModel