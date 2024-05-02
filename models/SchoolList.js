const mongoose = require("mongoose");

const School = new mongoose.Schema({
  SchoolName: {
    type: String,
    required: true,
  },

});

const School_List = mongoose.model("School_List", School);

module.exports = School_List;
