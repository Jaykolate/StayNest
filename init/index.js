const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/staynest";

async function main() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");

    // Initialize DB after connection
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({
      ...obj,
      owner: "695cca90ce03e79facb20418"
    }));
    await Listing.insertMany(initData.data);
    console.log("Data was initialized");

    mongoose.connection.close(); // Close connection after seeding
  } catch (err) {
    console.error(err);
  }
}

main();
