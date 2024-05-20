const express = require("express");
require("dotenv").config();
const collection = require("./db_config.js");
const passport = require("passport");
const expressLayouts = require("express-ejs-layouts");
const flash = require("connect-flash");
const session = require("express-session");
const mongoose = require("mongoose");
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const { forwardAuthenticated } = require("./config/auth.js");

const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

// socket connection
io.on("connection", (socket) => {

});

// Passport Config
require("./config/passport.js")(passport);

// Express body parser
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Express session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.success_msg2 = req.flash("success_msg2");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//Universal Access to any File Folder
app.use("/public", express.static("public"));

// Routes
app.use("/", require("./routes/index.js")(io));
app.use("/users", require("./routes/users.js")(io));
app.use("/action", require("./routes/action.js")(io));


//Route for action method
// app.use("/", require("../views/user/action_user"));
// app.use("/", require("../views/docs/doc_action"));


// Enable EJS to view EJS File Format
app.use(expressLayouts);
app.set("view engine", "ejs");


//
server.listen(8000, () => {
  console.log("SERVER PORT 8000: STARTED");
});
