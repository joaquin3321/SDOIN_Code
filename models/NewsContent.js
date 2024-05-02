const mongoose = require("mongoose");
const moment = require('moment');
const bodyParser = require("body-parser");
const Content = new mongoose.Schema({
  newsTitle: {
    type: String,
    required: true,
  },
  newsContent: {
    type: String,
    required: true,
  },
  newsImage: {
    type: String,
  },
  date: {
    type: String,
    default: () => moment().format("YYYY-MM-DD hh:mm A"),
  },
});


const NewsContent = mongoose.model("News_Content", Content);

module.exports = NewsContent;
