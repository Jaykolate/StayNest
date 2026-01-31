const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const Booking = require("../models/booking.js");

module.exports.index =async (req, res) => {
  const{search,category} =req.query;


  let query = {}; 
  if(search){
    query.$or=[
      {title:{$regex:search,$options:"i"}},
      {location:{$regex:search,$options:"i"}},
      {country:{$regex:search,$options:"i"}},

    ];
  }
  if(category && category!==""){
    query.category = category;

  }
  const allListings = await Listing.find(query);
  res.render("listings/index.ejs", {
    allListings,
    search,
    category,
  });
};


module.exports.RenderNewFrom =(req, res) => {
  
  res.render("listings/new.ejs");
};

module.exports.RenderShowRoute = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate({path:"reviews",populate:{
    path:"author",
  },}).populate("owner");
  if(!listing){
    req.flash("failure","Your listing does not exist!");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.CreateRoute=async (req, res) => {
  let response = await geocodingClient.forwardGeocode({
  query: req.body.listing.location,
  limit: 1,
})
  .send();
  
if (!response.body.features || response.body.features.length === 0) {
    req.flash("failure", "Invalid location. Please enter a valid place.");
    return res.redirect("/listings/new");
  }
  if (!req.file) {
  req.flash("error", "Image upload is required");
  return res.redirect("/listings/new");
}

  let url =req.file.path;
  let filename =req.file.filename;
   
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image ={url,filename};

  newListing.geometry = response.body.features[0].geometry;
  let savesListing = await newListing.save();
  console.log(savesListing);
  req.flash("success","new listing created!");
  res.redirect("/listings");
};

module.exports.EditRoute =async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
   if (!listing) {
    req.flash("failure", "Listing not found");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};
module.exports.UpdateRoute =async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if(typeof req.file!=="undefined"){
  let url =req.file.path;
  let filename =req.file.filename;
  
  listing.image ={url,filename};
  await listing.save();
  }
  req.flash("success","listings updated!");
  res.redirect(`/listings/${id}`);
};
module.exports.DeleteRoute =async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success","listings deleted successfully!");
  res.redirect("/listings");
};


module.exports.bookingForm =async (req, res) => {
  const listing = await Listing.findById(req.params.id);
   if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing");
    return res.redirect(`/listings/${listing._id}`);
  }
  const bookings = await Booking.find({ listing: listing._id });
  res.render("bookings/new", { listing, bookings });
};



module.exports.createBooking =async (req, res) => {

  try{
  const listing = await Listing.findById(req.params.id);
  const checkInDate = new Date(req.body.checkIn);
   const todayDate = new Date();
   todayDate.setHours(0, 0, 0, 0);

if (checkInDate < todayDate) {
  req.flash("error", "Check-in date cannot be in the past");
  return res.redirect(`/listings/${listing._id}/book`);
}


  // Prevent owner booking
  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing");
    return res.redirect(`/listings/${listing._id}`);
  }

  const {
    phone,
    checkIn,
    checkOut,
    nights,
    pricePerNight,
    totalAmount
  } = req.body;

  // SERVER-SIDE CALCULATION (IMPORTANT)
const nightsNum = Number(nights);
const priceNum = Number(pricePerNight);
const totalNum = Number(totalAmount);

const calculatedTotal = nightsNum * priceNum;

if (calculatedTotal !== totalNum) {
  req.flash("error", "Invalid booking amount");
  return res.redirect(`/listings/${listing._id}/book`);
}


  const overlappingBooking = await Booking.findOne({
      listing: listing._id,
      checkIn: { $lt: new Date(checkOut) },
      checkOut: { $gt: new Date(checkIn) }
    });

    if (overlappingBooking) {
      req.flash("error", "Selected dates are not available");
      return res.redirect(`/listings/${listing._id}/book`);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

const booking = new Booking({
  listing: listing._id,
  user: req.user._id,
  phone,
  checkIn: new Date(checkIn),
  checkOut: new Date(checkOut),
  nights: nightsNum,
  pricePerNight: priceNum,
  totalAmount: totalNum,
  expiresAt
});


await booking.save();

  req.flash("success", "Booking created successfully!");
  res.redirect(`/bookings/${booking._id}`);
}catch(err){
  req.flash("error", "An error occurred while creating the booking");
  res.redirect(`/listings/${req.params.id}/book`);
}
};

