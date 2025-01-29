const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerID: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String, unique: true, sparse: true },
  ByPhoneNumber: { type:Number, required:true },
  userId: { type: String, ref: 'User', required: true },
});

module.exports = mongoose.model('Customer-land', customerSchema);
