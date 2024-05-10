const mongoose = require("mongoose");

const Training_Attended = new mongoose.Schema({
  attendedID: {
    type: String,
  },
  userName: {
    type: String,
  },
  userSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School_List',
  },
  userPosition: {
    type: String,
    required: true,
  },
  userProfile: {
    type: String,
    default: null,
  },
  credential: [
    {
      trainingTitle: {
        type: String,
      },
      trainingCertificate: {
        type: String,
        default: null,
      },
      trainingStart:{
        type: String,
      },
      trainingEnd:{
        type: String,
      },
      trainingHours:{
        type: String,
      },
      trainingSponsor:{
        type: String,
      },
      trainingLevel:{
        type: String,
      },
    },
  ],
});

const TrainingAttended = mongoose.model("Training_Attended", Training_Attended);

module.exports = TrainingAttended;
