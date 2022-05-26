const mongoose = require('mongoose')
const Schema = mongoose.Schema

const questionSchema = new Schema(
  {
    index_of_ps: {
      type: Number,
      // required: true,
    },
    title: {
      type: String,
      // required: true,
    },
    code: {
      type: String,
      // required: true,
    },
    diff: {
      type: Number,
      // required: true,
    },
    submissions: {
      type: Number,
      // required: true,
    },
    url_ps: {
      type: String,
      // required: true,
    },
    // tfidf: {
    //   type: Array,
    //   // required: true,
    // },
    statement: {
      type: String,
      // required: true,
    },
  },
  { timestamps: true }
)

const Blog = mongoose.model('Blog', questionSchema)
module.exports = Blog
