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
  userSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School_List',
  },
});

const Event = mongoose.model("EventCalendar", EventCalendar);

module.exports = Event;
