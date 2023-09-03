const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cachedResultsSchema = new Schema({
  query: String,
  results: [Number],
  timestamp: { type: Date, default: Date.now }, // Add a timestamp field
});

const CachedResults = mongoose.model("CachedResults", cachedResultsSchema);
module.exports = CachedResults;
