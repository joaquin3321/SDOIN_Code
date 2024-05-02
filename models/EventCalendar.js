const mongoose = require("mongoose");

const EventCalendar = new mongoose.Schema({
  createTitle:{
    type: String,
    required: true
  },
  createDetails:{
    type: String,
    required: true
  },
  createStart:{
    type: String,
    required: true
  },
  createEnd:{
    type: String,
    required: true
  },
});

const Event = mongoose.model("EventCalendar", EventCalendar);

module.exports = Event;
