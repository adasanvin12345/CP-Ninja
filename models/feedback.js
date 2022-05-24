const mongoose = require('mongoose')
const Schema = mongoose.Schema

const fbSchema = new Schema(
  {
    name: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      // required: true,
    },
    college: {
      type: String,
      // required: true,
    },
    linkedin: {
      type: String,
      // required: true,
    },
    github: {
      type: String,
      // required: true,
    },
    fb: {
      type: String,
      // required: true,
    },
  },
  { timestamps: true }
)

const Fb = mongoose.model('Fb', fbSchema)
module.exports = Fb
