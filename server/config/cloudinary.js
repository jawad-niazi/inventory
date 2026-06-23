const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

console.log("=== CLOUDINARY DEBUG ===");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME || "❌ MISSING");
console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "✅ LOADED" : "❌ MISSING");
console.log("========================");

module.exports = cloudinary


