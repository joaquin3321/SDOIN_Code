const mongoose = require("mongoose");

const Learning_Resources = new mongoose.Schema({

  resourcesTitle:{
    type: String,
    required: true
  },
  whoAdded:{
    type: String,
  },
  resourcesFile:{
    type: String,
  },
  userSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School_List',
  },

});

const LearningResources = mongoose.model("Learning_Resources", Learning_Resources);

module.exports = LearningResources;
