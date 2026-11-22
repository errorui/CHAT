const { randomUUID } = require("crypto");

const FOLDER = "talk-tip/avatars";

let client;

// The sdk reads CLOUDINARY_URL as soon as it is required, so wait until dotenv has run
const getCloudinary = () => {
  if (client !== undefined) return client;
  client = null;
  if (!process.env.CLOUDINARY_URL) {
    console.warn("CLOUDINARY_URL is not set, profile pictures will be stored in MongoDB");
    return client;
  }
  try {
    client = require("cloudinary").v2;
  } catch (error) {
    // only the message, the url holds the api secret
    console.error("CLOUDINARY_URL is invalid, profile pictures will be stored in MongoDB:", error.message);
  }
  return client;
};

const upload = (cloudinary, buffer) =>
  new Promise((resolve, reject) => {
    const options = {
      public_id: `${FOLDER}/${randomUUID()}`,
      resource_type: "image",
      timeout: 20000,
      // shrink what gets stored, never enlarge it
      transformation: [{ width: 512, height: 512, crop: "lfill" }],
    };
    cloudinary.uploader
      .upload_stream(options, (error, result) => (error ? reject(error) : resolve(result)))
      .end(buffer);
  });

// the user fields to save for this picture
const storeAvatar = async (buffer) => {
  const cloudinary = getCloudinary();
  if (cloudinary) {
    try {
      const { secure_url, public_id } = await upload(cloudinary, buffer);
      return { ProfilePic: secure_url, avatarPublicId: public_id };
    } catch (error) {
      console.error("Cloudinary upload failed, storing the picture in MongoDB:", error.message);
    }
  }
  return { ProfilePic: buffer.toString("base64"), avatarPublicId: "" };
};

const deleteAvatar = async (publicId) => {
  if (!publicId) return;
  try {
    await getCloudinary()?.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (error) {
    console.error("Could not delete old picture from Cloudinary:", error.message);
  }
};

// automatic format and quality
const deliveryUrl = (url) => url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");

module.exports = { storeAvatar, deleteAvatar, deliveryUrl };
