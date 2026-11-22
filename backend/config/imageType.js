// the client supplied mime type can't be trusted, so check the first bytes
const imageType = (buffer) => {
  const hex = buffer.toString("hex", 0, 12);
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("474946383761") || hex.startsWith("474946383961")) return "image/gif";
  if (hex.startsWith("52494646") && hex.endsWith("57454250")) return "image/webp";
  return null;
};

module.exports = { imageType };
