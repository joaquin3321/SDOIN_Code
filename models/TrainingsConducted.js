const mongoose = require("mongoose");

const Training_Conducted = new mongoose.Schema({

  titleActivity:{
    type: String,
  },
  output:{
    type: String,
  },
  dateConducted:{
    type: String,
  },
  budgetAllocation:{
    type: String,
  },
  participants:{
    type: String,
  },
  physicalTarget:{
    type: String,
  },
  accomplishment:{
    type: String,
  },
  sourceof_fund:{
    type: String,
  },
  remarks:{
    type: String,
  },


});

const TrainingConducted = mongoose.model("Training_Conducted", Training_Conducted);

module.exports = TrainingConducted;
