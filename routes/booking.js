const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/booking");
const { isLoggedIn } = require("../middleware");

// show booking
router.get("/:id", isLoggedIn, async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("listing")
    .populate("user");

  res.render("bookings/show", { booking });
});

router.get("/:id/pay", isLoggedIn, async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("listing");

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/listings");
  }

  if (booking.paymentStatus !== "pending") {
    req.flash("error", "Booking already paid or cancelled");
    return res.redirect(`/bookings/${booking._id}`);
  }

  // 🚨 Expired booking check
  if (booking.expiresAt < new Date()) {
    booking.paymentStatus = "cancelled";
    await booking.save();
    req.flash("error", "Booking expired");
    return res.redirect(`/listings/${booking.listing._id}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: booking.listing.title,
          },
          unit_amount: booking.totalAmount * 100, // paise
        },
        quantity: 1,
      },
    ],
    success_url: `${req.protocol}://${req.get("host")}/bookings/${booking._id}/payment-success`,
    cancel_url: `${req.protocol}://${req.get("host")}/bookings/${booking._id}`,
  });

  res.redirect(session.url);
});


// payment success
router.get("/:id/payment-success", isLoggedIn, async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking || booking.paymentStatus !== "pending") {
    return res.redirect("/listings");
  }

  booking.paymentStatus = "paid";
  await booking.save();

  req.flash("success", "Payment successful! Booking confirmed.");
  res.redirect(`/bookings/${booking._id}`);
});


module.exports = router;