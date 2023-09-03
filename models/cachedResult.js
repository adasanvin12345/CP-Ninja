const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cachedResultsSchema = new Schema(
  {
    query: String,
    results: [Number],
  },
  { capped: { size: 1000000, max: 1000 } }
);

const CachedResults = mongoose.model("CachedResults", cachedResultsSchema);
module.exports = CachedResults;
