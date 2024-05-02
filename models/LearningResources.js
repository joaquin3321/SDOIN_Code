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

});

const LearningResources = mongoose.model("Learning_Resources", Learning_Resources);

module.exports = LearningResources;
