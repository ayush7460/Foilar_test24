const express = require("express");
const cloudinary = require("./cloudinaryConfig");
const upload = require("./multerConfig");
const fs = require("fs");
const Customer = require("./../../models/loans/loanSchema"); // Import your Customer Model


const router = express.Router();


// Upload Image for a Specific Customer
router.post("/upload/:customerID", upload.single("image"), async (req, res) => {
  try {
    const { customerID } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Find customer and get old image URL
    const customer1 = await Customer.findOne({ customerID });

    if (customer1 && customer1.profileImage) {
      // Extract public_id from Cloudinary URL
      const oldImagePublicId = customer1.profileImage
        .split("/customer_images/")[1]
        .split(".")[0];

      // Delete old image from Cloudinary
      await cloudinary.uploader.destroy(`customer_images/${customerID}/${oldImagePublicId}`);
    }

    // Upload Image to Cloudinary
    cloudinary.uploader.upload_stream(
      { folder: `customer_images/${customerID}` },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return res.status(500).json({ error: "Cloudinary upload failed", details: error.message });
        }

        // Update customer with new profile image URL
        const customer = await Customer.findOneAndUpdate(
          { customerID: customerID },
          { profileImage: result.secure_url },
          { new: true, upsert: true }
        );

        return res.json({ message: "Image uploaded successfully", imageUrl: result.secure_url, customer });
      }
    ).end(req.file.buffer);

  } catch (error) {
    console.error("Error uploading image:", error);
    if (!res.headersSent) { // ✅ Prevent duplicate response
      res.status(500).json({ error: "Image upload failed", details: error.message });
    }
  }
});


  router.get("/imag/:customerID", async (req, res) => {
    try {
      const customer = await Customer.findOne({ customerID: req.params.customerID });
  
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
  
      res.json({ profileImage: customer.profileImage }); // Only return image URL
    } catch (error) {
      res.status(500).json({ error: "Error retrieving customer", details: error.message });
    }
  });
  
  module.exports = router;