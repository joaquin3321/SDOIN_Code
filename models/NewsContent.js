const mongoose = require("mongoose");
const moment = require('moment');
const bodyParser = require("body-parser");
const Content = new mongoose.Schema({
  newsTitle: {
    type: String,
  },
  newsContent: {
    type: String,
  },
  newsImage: {
    type: [String],
  },
  userSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School_List',
  },
  date: {
    type: String,
    default: () => moment().format("YYYY-MM-DD hh:mm A"),
  },
});


const NewsContent = mongoose.model("News_Content", Content);

module.exports = NewsContent;
