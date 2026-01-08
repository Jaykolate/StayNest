const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index =async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
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