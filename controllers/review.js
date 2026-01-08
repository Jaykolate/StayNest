const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.CreateRoute =async(req,res)=>{
  let listing = await Listing.findById(req.params.id);
   if (!listing) {
    req.flash("failure", "Listing not found");
    return res.redirect("/listings");
  }
  let newReview = new Review(req.body.review);
   newReview.author = req.user._id; 
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();
  req.flash("success","new review created!");
  res.redirect(`/listings/${listing._id}`);
};

