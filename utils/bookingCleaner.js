const cron = require("node-cron");
const Booking = require("../models/booking");

cron.schedule("* * * * *", async () => {
  const now = new Date();

  const expiredBookings = await Booking.find({
    paymentStatus: "pending",
    expiresAt: { $lt: now }
  });

  for (let booking of expiredBookings) {
    booking.paymentStatus = "cancelled";
    await booking.save();
  }

  if (expiredBookings.length > 0) {
    console.log(`⏰ Cancelled ${expiredBookings.length} expired bookings`);
  }
});
