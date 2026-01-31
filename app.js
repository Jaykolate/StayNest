require('dotenv').config();


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressErr = require("./utils/ExpressErr.js");
require("./utils/bookingCleaner");

const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const user = require("./routes/user.js");
const User = require("./models/user");
const listingRoutes = require("./routes/listing");
const bookingRoutes = require("./routes/booking");





const Dburl = process.env.ATLASDB_USER;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(Dburl);
}

app.use((req, res, next) => {
  console.log("METHOD:", req.method);
  console.log("URL:", req.url);
  next();
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

//routes
const store = MongoStore.create({
   mongoUrl: Dburl,
   touchAfter:24 * 3600,
});



const sessionOptions={
  store,
  secret: process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+7*24*60*60*1000,
    maxAge:7*24*60*60*1000,
    httpOnly:true
  },
};


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.failure = req.flash("failure");
  res.locals.currUser = req.user;
  res.locals.search = req.query.search || "";
  next();
});






app.use("/listings", listingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/",user);


// Catch-all 404 handler
app.use((req, res, next) => {
  next(new ExpressErr(404, `Cannot find ${req.originalUrl}`));
});

//Error Handling Middleware

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err); // 🔑 PREVENT DOUBLE RESPONSE
  }

  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("listings/error.ejs", { statusCode, message });
});


app.listen(8080, () => {
  console.log("server is listening to port 8080");
});