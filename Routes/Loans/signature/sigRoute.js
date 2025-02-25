const express = require("express");
const cloudinary = require("../../dbs/cloudinaryConfig");
const upload = require("../../dbs/multerConfig");
const fs = require("fs");
const Loan = require("../../../models/loans/loanSchema"); // Import your Customer Model


const router = express.Router();


// Upload Signature Image for a Specific Customer
router.post("/signature/upload/:customerID", upload.single("image"), async (req, res) => {
    try {
        const { customerID } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: "No signature image uploaded" });
        }

        console.log("Received file:", req.file); // Debugging line

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: `customer_signatures/${customerID}`
        });

        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        // Update loan record in database
        const updatedLoan = await Loan.findOneAndUpdate(
            { customerID: customerID },
            { 
                $set: { "loanDetails.signature": [{ path: result.secure_url, date: new Date() }] } 
            },
            { new: true, upsert: true }
        );

        res.json({ message: "Signature uploaded successfully", signatureUrl: result.secure_url, updatedLoan });

    } catch (error) {
        console.error("Signature upload failed:", error);
        res.status(500).json({ error: "Signature upload failed", details: error.message });
    }
});


  router.get("/signature/imag/:customerID", async (req, res) => {
    try {
      const customer = await Loan.findOne({ customerID: req.params.customerID });
  
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
  
      res.json({ profileImage: customer.profileImage }); // Only return image URL
    } catch (error) {
      res.status(500).json({ error: "Error retrieving customer", details: error.message });
    }
  });
  
  module.exports = router;