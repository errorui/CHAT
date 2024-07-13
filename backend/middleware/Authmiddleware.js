const jwt = require("jsonwebtoken");

const asyncHandler = require("express-async-handler");
const userModel = require("../models/userModel");

const protect = asyncHandler(async (req, res, next) => {

    let token;
    const authHeader = req.headers['authorization'];
    // Try to get the token from the cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
     
      

    } 
    else if (
     
     authHeader&&
      authHeader.startsWith("Bearer")
    ) {
        console.log("hi")
      // If not in cookies, try to get it from the authorization header
      token = authHeader.split(' ')[1];
    }
  
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }
  
    try {
      const decoded = jwt.verify(token, process.env.SECRET);
     
  
      req.user = await userModel.findById(decoded.id).select("-password");
      
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  });
  
  module.exports = { protect };
