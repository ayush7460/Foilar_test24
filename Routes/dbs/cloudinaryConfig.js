const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dvopqpu5k",
  api_key: "556568254341843",
  api_secret: "Ov7zwbx5F6cJYB76sQkhCIYbWTo",
});

module.exports = cloudinary;

// cloud_name: process.env.Cloud_name || "dvopqpu5k",
// api_key: process.env.Api_key || "513979796987495",
// api_secret: process.env.Api_secre || "D9_QhGim0a4O2CYhzvF7Ur1Br2I",