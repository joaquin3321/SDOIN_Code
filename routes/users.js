const express = require("express");
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const passport = require("passport");
const multer = require("multer");
const nodemailer = require("nodemailer");

// Load User model
const User = require("../models/Users");
// Load News Content model
const NewsContent = require("../models/NewsContent");
// Load Speaker Info model
const SpeakerInfo = require("../models/SpeakerInfo");
// Load Learning Resources Info model
const LearningResources = require("../models/LearningResources");
// Load Trainings Conducted Info model
const TrainingConducted = require("../models/TrainingsConducted");
// Load Trainings Conducted Info model
const TrainingAttended = require("../models/TrainingsAttended");
// Load Trainings Conducted Info model
const School_List = require("../models/SchoolList");

const Event = require("../models/EventCalendar");

const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

function socketRouter(io) {
  const router = express.Router();

  async function getUserEmails() {
    try {
      const users = await User.find({}, "userEmail"); // Retrieve all user emails
      return users.map((user) => user.userEmail); // Return an array of email addresses
      console.log(users);
    } catch (err) {
      console.error("Error fetching user emails:", err);
      return [];
    }
  }

  // Define your password (replace 'yourPassword' with your actual password)
  const correctPassword = "AdminOnly";

  // Middleware function to check the password
  const checkPassword = (req, res, next) => {
    // Check if the request contains a valid password
    const enteredPassword = req.query.password; // assuming password is sent as a query parameter
    if (!enteredPassword || enteredPassword !== correctPassword) {
      // Incorrect password, send an alert and redirect
      return res.status(200).send(`
      <script>
        const enteredPassword = prompt('Please enter the password:');
        if (!enteredPassword || enteredPassword !== '${correctPassword}') {
          alert('Incorrect password. Access denied.');
          window.location.href = '/login'; // Redirect to home or another page
        } else {
          window.location.href = '/users/register?password=${correctPassword}';
        }

      </script>
    `);
    }

    // Password is correct, proceed to the next middleware or route handler
    next();
  };
  // Register ROUTE
  router.get(
    "/register",
    forwardAuthenticated,
    checkPassword,
    async (req, res) => {
      try {
        const userSchool = await School_List.find({}, "SchoolName");
        res.render("register", {
          userSchoolList: userSchool,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    }
  );

  // Login
  router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/login",
      failureFlash: true,
    })(req, res, next);
  });

  // Logout
  router.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        // Handle any errors that occur during logout
        console.error(err);
        return res.redirect("/"); // Redirect to a suitable page
      }
      // If the logout was successful, redirect to another page or show a message
      req.flash("success_msg", "You are logged out");
      res.redirect("/login"); // Redirect to the login page
    });
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //Cancel Form
  router.get("/cancel", (req, res) => {
    req.flash("success_msg", "Cancel Successfully");
    res.redirect("/CreateAccount");
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.post("/addSchool", async (req, res) => {
    const { SchoolName } = req.body;
    const school = new School_List({
      SchoolName,
    });
    try {
      await school.save();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
    req.flash("success_msg", `School Created Successfully.`);
    return res.redirect("/SchoolList");
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Register an account
  router.post("/register", async (req, res) => {
    try {
      const userSchoolList = await School_List.find({}, "SchoolName");
      const {
        userName,
        userSchool,
        userPosition,
        userDepartment,
        userType,
        userProfile,
        userEmail,
        userPass,
        userPass2,
      } = req.body;
      let errors = [];
      console.log("Welcome to the system", userName);
      const generatedUuid = uuid.v4();
      const capitalizedUserName = capitalizeEachWord(userName);
      const capitalizeduserPosition = capitalizeEachWord(userPosition);

      if (!userName || !userPosition || !userEmail || !userPass || !userPass2) {
        errors.push({ msg: "Please enter all fields" });
      }

      if (userPass != userPass2) {
        errors.push({ msg: "Passwords do not match" });
      }

      if (userPass.length < 6) {
        errors.push({ msg: "Password must be at least 6 characters" });
      }

      if (errors.length > 0) {
        res.render("register", {
          userSchoolList: userSchoolList,
          errors,
          userName,
          userSchool,
          userPosition,
          userDepartment,
          userType,
          userEmail,
          userPass,
          userPass2,
        });
      } else {
        User.findOne({ userEmail: userEmail }).then((user) => {
          if (user) {
            errors.push({ msg: "Email already exists" });
            res.render("register", {
              userSchoolList: userSchoolList,
              errors,
              userName,
              userSchool,
              userPosition,
              userDepartment,
              userType,
              userEmail,
              userPass,
              userPass2,
            });
          } else {
            const newUser = new User({
              attendedID: generatedUuid,
              userName: capitalizedUserName,
              userSchool,
              userPosition: capitalizeduserPosition,
              userDepartment,
              userType,
              userProfile,
              userEmail,
              userPass,
            });

            sendEmailNotificationNewUser(newUser);

            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.userPass, salt, (err, hash) => {
                if (err) throw err;
                newUser.userPass = hash;
                newUser
                  .save()
                  .then((user) => {
                    req.flash(
                      "success_msg",
                      "You Can Now Successfully Log-in!!"
                    );
                    res.redirect("/login");
                  })
                  .catch((err) => console.log(err));
              });
            });
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  const EmailCheck = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address (use environment variables)
      pass: process.env.EMAIL_PASS, // Gmail app password
    },
  });

  // Function to send an email notification to multiple recipients
  async function sendEmailNotificationNewUser(newUser) {
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email address
      to: newUser.userEmail, // Join all email addresses with commas
      subject: `INMaestroLXP - Thank you for registering`, // Email subject
      text: `Dear ${newUser.userName}. \n\nYou have successfully registered to INMaestroLXP: HUMAN RESOURCES DEVELOPMENT SYSTEM FOR EDUCATION PROFESSIONALS! \n\n\n Thank You. \n\n\n INMaestroLXP Developer.
      \n\n\n\n *** This is a system generated message DO NOT REPLY TO THIS EMAIL. ***
      `, // Email body
    };

    EmailCheck.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log(`Email sent New User ${newUser.userName} :`, info.response);
      }
    });
  }

  function capitalizeEachWord(str) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  router.post("/admin/register", async (req, res) => {
    try {
      const userSchoolList = await School_List.find({}, "SchoolName");
      console.log(req.body);
      const {
        userName,
        userSchool,
        userPosition,
        userDepartment,
        userType,
        userProfile,
        userEmail,
        userPass,
        userPass2,
      } = req.body;
      let errors = [];

      // Capitalize each word in userName
      const generatedUuid = uuid.v4();
      const capitalizedUserName = capitalizeEachWord(userName);
      const userSchoolUserName = capitalizeEachWord(userSchool);
      const capitalizeduserPosition = capitalizeEachWord(userPosition);

      if (
        !userName ||
        !userSchool ||
        !userPosition ||
        !userEmail ||
        !userPass ||
        !userPass2
      ) {
        errors.push({ msg: "Please enter all fields" });
      }

      if (userPass != userPass2) {
        errors.push({ msg: "Passwords do not match" });
      }

      if (userPass.length < 6) {
        errors.push({ msg: "Password must be at least 6 characters" });
      }

      if (errors.length > 0) {
        res.render("Content/CreateAccount", {
          userSchoolList: userSchoolList,
          user: req.user,
          errors,
          userName,
          userSchool,
          userPosition,
          userDepartment,
          userType,
          userEmail,
          userPass,
          userPass2,
        });
      } else {
        User.findOne({ userEmail: userEmail }).then((user) => {
          if (user) {
            errors.push({ msg: "Email already exists" });
            res.render("Content/CreateAccount", {
              userSchoolList: userSchoolList,
              user: req.user,
              errors,
              userName,
              userSchool,
              userPosition,
              userDepartment,
              userType,
              userEmail,
              userPass,
              userPass2,
            });
          } else {
            const newUser = new User({
              attendedID: generatedUuid,
              userName: capitalizedUserName,
              userSchool: userSchoolUserName,
              userPosition: capitalizeduserPosition,
              userDepartment,
              userType,
              userProfile,
              userEmail,
              userPass,
            });

            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.userPass, salt, (err, hash) => {
                if (err) throw err;
                newUser.userPass = hash;
                newUser
                  .save()
                  .then((user) => {
                    req.flash(
                      "success_msg",
                      "You Successfully Create an Account!"
                    );
                    res.redirect("/CreateAccount");
                  })
                  .catch((err) => console.log(err));
              });
            });
          }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File Upload for the News Images
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/SDOIN_Code/public/news");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadNews = multer({
    storage: storage,
  }).single("newsImage");

  //Handles of adding news to the Users
  router.post("/addNews", uploadNews, async (req, res) => {
    const { newsTitle, newsContent } = req.body;
    const news = new NewsContent({
      newsTitle,
      newsContent,
      newsImage: req.file ? req.file.filename : "", // Use the file name if provided
    });
    io.emit("newNews", news);
    sendEmailNotificationNews(news);

    console.log(news);

    try {
      await news.save();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
    req.flash("success_msg", `News Created Successfully.`);
    return res.redirect("/dashboard");
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address (use environment variables)
      pass: process.env.EMAIL_PASS, // Gmail app password
    },
  });

  // Function to send an email notification to multiple recipients
  async function sendEmailNotificationNews(news) {
    const recipientEmails = await getUserEmails(); // Fetch all user emails

    if (recipientEmails.length === 0) {
      console.warn("No email recipients found.");
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email address
      to: recipientEmails.join(","), // Join all email addresses with commas
      subject: `New news has been posted by the Admin`, // Email subject
      text: `A new news item has been created:\n\nTitle: ${news.newsTitle}.\n\nGo check the website for more Information!
      \n\n\n\n *** This is a system generated message DO NOT REPLY TO THIS EMAIL. ***
      `, // Email body
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //Upload image for the speakers
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/SDOIN_Code/public/speaker");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadSpeaker = multer({
    storage: storage,
  }).fields([
    { name: "speakerImage", maxCount: 1 },
    { name: "speakerBiodata", maxCount: 1 },
  ]);

  //Handles of adding speakers to the Users
  router.post("/addSpeaker", uploadSpeaker, async (req, res) => {
    const { speakerName, speakerPosition, speakerSchool, speakerDistrict } =
      req.body;
    const speaker = new SpeakerInfo({
      speakerName,
      speakerPosition,
      speakerSchool,
      speakerDistrict,
      speakerBiodata: req.files["speakerBiodata"]
        ? req.files["speakerBiodata"][0].filename
        : "",
      speakerImage: req.files["speakerImage"]
        ? req.files["speakerImage"][0].filename
        : "",
    });

    io.emit("newSpeaker", speaker);
    console.log(speaker);

    try {
      await speaker.save();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
    req.flash("success_msg", `Speaker Created Successfully.`);
    return res.redirect("/speakers");
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File Upload for the News Images
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/SDOIN_Code/public/resources");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadResources = multer({
    storage: storage,
  }).single("resourcesFile");

  //Handles of adding news to the Users
  router.post("/addResources", uploadResources, async (req, res) => {
    const { resourcesTitle, whoAdded } = req.body;
    const resources = new LearningResources({
      resourcesTitle,
      whoAdded,
      resourcesFile: req.file ? req.file.filename : "", // Use the file name if provided
    });
    io.emit("newResources", resources);
    console.log(resources);
    try {
      await resources.save();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
    req.flash("success_msg", `Resources Created Successfully.`);
    return res.redirect("/resources");
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.post("/addConducted", async (req, res) => {
    const {
      programOwner,
      titleActivity,
      output,
      dateConducted,
      budgetAllocation,
      participants,
      responsibleUnit,
      physicalTarget,
      accomplishment,
      sourceof_fund,
      remarks,
    } = req.body;

    const conducted = new TrainingConducted({
      programOwner,
      titleActivity,
      output,
      dateConducted,
      budgetAllocation,
      participants,
      responsibleUnit,
      physicalTarget,
      accomplishment,
      sourceof_fund,
      remarks,
    });
    io.emit("newConducted", conducted);
    console.log(conducted);
    try {
      await conducted.save();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
    req.flash("success_msg", `Training Conducted Created Successfully.`);
    return res.redirect("/conducted");
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File Upload for the News Images
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/SDOIN_Code/public/attended");
    },
    filename: function (req, file, cb) {
      cb(null, "trainingCertificate_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadCertificate = multer({
    storage: storage,
  }).any();

  router.post("/addTrainingAttended", uploadCertificate, async (req, res) => {
    const {
      attendedID,
      userName,
      userSchool,
      userPosition,
      userProfile,
      credential,
    } = req.body;
    const trainingTitles = credential.map((item) => item.trainingTitle);

    try {
      // Check if a document with the same "userName" exists
      const existingResource = await TrainingAttended.findOne({ attendedID });

      const certificateFiles = req.files; // Use req.files for multiple file uploads

      if (existingResource) {
        // Update the existing document with the new credential data
        trainingTitles.forEach((item, index) => {
          existingResource.credential.push({
            trainingTitle: item,
            trainingCertificate: certificateFiles[index]
              ? certificateFiles[index].filename
              : "",
            trainingStart: credential[index].trainingStart,
            trainingEnd: credential[index].trainingEnd,
            trainingHours: credential[index].trainingHours,
            trainingSponsor: credential[index].trainingSponsor,
            trainingLevel: credential[index].trainingLevel,
          });
        });

        if (userProfile) {
          existingResource.userProfile = userProfile;
        }

        await existingResource.save();
      } else {
        // Create a new document
        const attended = new TrainingAttended({
          attendedID,
          userName,
          userSchool,
          userPosition,
          userProfile,
          credential: trainingTitles.map((item, index) => ({
            trainingTitle: item,
            trainingCertificate: certificateFiles[index]
              ? certificateFiles[index].filename
              : "",
            trainingStart: credential[index].trainingStart,
            trainingEnd: credential[index].trainingEnd,
            trainingHours: credential[index].trainingHours,
            trainingSponsor: credential[index].trainingSponsor,
            trainingLevel: credential[index].trainingLevel,
          })),
        });
        await attended.save();
      }

      req.flash("success_msg", "Personal Training List Created Successfully.");
      return res.redirect("/PersonalTraining");
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.post("/addTeacherAttended", async (req, res) => {
    const { attendedID, userSchool, credential } = req.body;
    const trainingTitles = credential.map((item) => item.trainingTitle);

    try {
      const TeachersID = Array.isArray(attendedID) ? attendedID : [attendedID];

      for (const TeacherID of TeachersID) {
        // Check if a document with the same "attendedID" exists
        const existingResource = await TrainingAttended.findOne({
          attendedID: TeacherID,
        });

        const data = await User.findOne({
          attendedID: TeacherID,
        });
        const userName = data.userName;
        const userProfile = data.userProfile;
        const userPosition = data.userPosition;

        if (existingResource) {
          // Update the existing document with the new credential data
          trainingTitles.forEach((item, index) => {
            existingResource.credential.push({
              trainingTitle: item,
              trainingStart: credential[index].trainingStart,
              trainingEnd: credential[index].trainingEnd,
            });
          });

          // Update userProfile if provided
          if (userProfile) {
            existingResource.userProfile = userProfile;
          }

          await existingResource.save();
        } else {
          // Create a new document
          const attended = new TrainingAttended({
            attendedID: TeacherID,
            userName: userName,
            userSchool,
            userProfile: userProfile,
            userPosition: userPosition,
            credential: trainingTitles.map((item, index) => ({
              trainingTitle: item,
              trainingCertificate: null,
              trainingStart: credential[index].trainingStart,
              trainingEnd: credential[index].trainingEnd,
            })),
          });
          await attended.save();
        }
      }

      req.flash("success_msg", "Training for Teacher Created Successfully.");
      return res.redirect("/TeachersTraining");
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.post("/addDivisionAttended", async (req, res) => {
    const { attendedID, userSchool, credential } = req.body;
    const trainingTitles = credential.map((item) => item.trainingTitle);

    try {
      const TeachersID = Array.isArray(attendedID) ? attendedID : [attendedID];

      for (const TeacherID of TeachersID) {
        // Check if a document with the same "attendedID" exists
        const existingResource = await TrainingAttended.findOne({
          attendedID: TeacherID,
        });

        const data = await User.findOne({
          attendedID: TeacherID,
        });
        const userName = data.userName;
        const userProfile = data.userProfile;
        const userPosition = data.userPosition;

        if (existingResource) {
          // Update the existing document with the new credential data
          trainingTitles.forEach((item, index) => {
            existingResource.credential.push({
              trainingTitle: item,
              trainingStart: credential[index].trainingStart,
              trainingEnd: credential[index].trainingEnd,
            });
          });

          // Update userProfile if provided
          if (userProfile) {
            existingResource.userProfile = userProfile;
          }

          await existingResource.save();
        } else {
          // Create a new document
          const attended = new TrainingAttended({
            attendedID: TeacherID,
            userName: userName,
            userSchool,
            userProfile: userProfile,
            userPosition: userPosition,
            credential: trainingTitles.map((item, index) => ({
              trainingTitle: item,
              trainingCertificate: null,
              trainingStart: credential[index].trainingStart,
              trainingEnd: credential[index].trainingEnd,
            })),
          });
          await attended.save();
        }
      }

      req.flash("success_msg", "Training Created Successfully.");
      return res.redirect("/DivisionsTraining");
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
  });

  router.post("/addEvent", async (req, res) => {
    const { createTitle, createDetails, createStart, createEnd } = req.body;
    const event = new Event({
      createTitle,
      createDetails,
      createStart,
      createEnd,
    });
    console.log(event);
    sendEmailNotificationEvent(event);
    try {
      await event.save();
    } catch (error) {
      console.error(err);
      return res.status(500).json({ message: err.message, type: "danger" });
    }
    return res.redirect("/calendar");
  });

  async function sendEmailNotificationEvent(event) {
    const recipientEmails = await getUserEmails(); // Fetch all user emails

    if (recipientEmails.length === 0) {
      console.warn("No email recipients found.");
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email address
      to: recipientEmails.join(","), // Join all email addresses with commas
      subject: `New event has been posted by the Admin`, // Email subject
      text: `A new Event item has been created:\n\nTitle: ${event.createTitle}.\n\n Go check the website for more Information!
      \n\n\n\n *** This is a system generated message DO NOT REPLY TO THIS EMAIL. ***
      `, // Email body
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log(`Event sent: ${event.createTitle}`, info.response);
      }
    });
  }

  return router;
}

module.exports = socketRouter;
