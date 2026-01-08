const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema } = require("../Schema.js");
const ExpressErr = require("../utils/ExpressErr.js");
const Listing = require("../models/listing.js");
const {isLoggedIn,isOwner} = require("../middleware.js");
const listingController = require("../controllers/listings.js")
const multer = require('multer');
const {storage} = require("../cloudConfig.js")
const upload = multer({storage});




const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    throw new ExpressErr(400, error.details[0].message);
  }
  next();
};

//Index Route
router.get("/", wrapAsync(listingController.index));

//New Route
router.get("/new",isLoggedIn, listingController.RenderNewFrom);



//Show Route
router.get("/:id", wrapAsync(listingController.RenderShowRoute));

//Create Route
router.post("/", isLoggedIn, upload.single("listing[image]"),validateListing,wrapAsync(listingController.CreateRoute));

//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.EditRoute));

//Update Route
router.put("/:id",isLoggedIn,isOwner,upload.single("listing[image]"), validateListing, wrapAsync(listingController.UpdateRoute));

//Delete Route
router.delete("/:id",isLoggedIn,isOwner, wrapAsync(listingController.DeleteRoute));

module.exports = router;