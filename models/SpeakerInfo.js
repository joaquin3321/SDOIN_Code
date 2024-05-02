const mongoose = require("mongoose");
const moment = require('moment');
const bodyParser = require("body-parser");
const SpeakerInfo = new mongoose.Schema({
  speakerName: {
    type: String,
    required: true,
  },
  speakerPosition: {
    type: String,
    required: true,
  },
  speakerSchool: {
    type: String,
    required: true,
  },
  speakerDistrict: {
    type: String,
    required: true,
  },
  speakerBiodata: {
    type: String,

  },
  speakerImage: {
    type: String,
  },
  date: {
    type: String,
    default: () => moment().format("YYYY-MM-DD hh:mm A"),
  },
});


const NewSpeaker = mongoose.model("New_Speaker", SpeakerInfo);

module.exports = NewSpeaker;
