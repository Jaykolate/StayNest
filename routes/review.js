const express = require("express");
const router = express.Router({ mergeParams: true });
const Review = require("../models/review.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { reviewSchema } = require("../Schema.js");
const ExpressErr = require("../utils/ExpressErr.js");
const Listing = require("../models/listing.js");
const {isLoggedIn,isAuthor} = require("../middleware.js");
const reviewController = require("../controllers/review.js")

const validateReviews = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    throw new ExpressErr(400, error.details[0].message);
  }
  next();
};


router.post("/",isLoggedIn,validateReviews, wrapAsync(reviewController.CreateRoute));

//delete riute

router.delete("/:reviewId", isLoggedIn,isAuthor,wrapAsync(async(req,res)=>{
  let {id,reviewId} = req.params;
  await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
  await Review.findByIdAndDelete(reviewId);
req.flash("success","revew deleted successfully!");
  res.redirect(`/listings/${id}`);

}));

module.exports = router;