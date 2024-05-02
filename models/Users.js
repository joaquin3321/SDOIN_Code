const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userSchool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School_List',
  },
  attendedID: {
    type: String,
  },
  userType: {
    type: String,
    default: "User",
  },
  userProfile: {
    type: String,
    default: null,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userPosition: {
    type: String,
    required: true,
  },
  userPass: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("Doc_User", UserSchema);

module.exports = User;
