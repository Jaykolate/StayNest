const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: true
  },

  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  checkIn: {
    type: Date,
    required: true
  },

  checkOut: {
    type: Date,
    required: true
  },

  nights: {
    type: Number,
    required: true,
    min: 1
  },

  pricePerNight: {
    type: Number,
    required: true
  },

  totalAmount: {
    type: Number,
    required: true
  },

  paymentStatus: {
    type: String,
    default: "pending" // later: paid
  },
  expiresAt: {
  type: Date,
  required: true
}

}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
