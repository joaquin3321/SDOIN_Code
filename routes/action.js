const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const passport = require("passport");

const multer = require("multer");
const fs = require("fs/promises");

const User = require("../models/Users");
const NewsContent = require("../models/NewsContent");
const SpeakerInfo = require("../models/SpeakerInfo");
const LearningResources = require("../models/LearningResources");
const TrainingConducted = require("../models/TrainingsConducted");
const TrainingAttended = require("../models/TrainingsAttended");
const School_List = require("../models/SchoolList");
const Event = require("../models/EventCalendar");

function socketRouter(io) {
  const router = express.Router();

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File for the User's Profile Image
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/Thesis/DepEd/SDOIN_Code/public/img");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });
  var uploadUser = multer({
    storage: storage,
  }).single("userProfile");

  // API route to Edit the user's credential
  router.patch("/updateUser/:userID", uploadUser, async (req, res) => {
    try {
      const userID = req.params.userID;
      const attendedID = req.user.attendedID;
      const updateData = req.body;
      console.log(updateData)

      // Check if a file is included in the request
      if (req.file) {
        updateData.userProfile = req.file.filename;
      }
      if (updateData.userSchool === null) {
        delete updateData.userSchool; // Keeps the original value
      }

      // Check if the updateData includes a new password
      if (updateData.userPass) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(updateData.userPass, salt);
        updateData.userPass = hashedPassword;
      }

      // Update the User model
      const updatedUser = await User.findByIdAndUpdate(userID, updateData, {
        new: true,
      });

      // Update the TrainingAttended model
      const updatedTrainingAttended = await TrainingAttended.updateMany(
        { attendedID: attendedID },
        {
          $set: {
            userProfile: updateData.userProfile,
            userName: updateData.userName,
            userPosition: updateData.userPosition,
            userSchool: updateData.userSchool,
          }
        }
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, message: "User not found" });
      } else {
        if (updateData.userPass) {
          req.flash(
            "success_msg",
            `User's Password Updated Successfully. User Name: <b>${updatedUser.userName}</b>`
          );
        }

        console.log("User's Password Updated Successfully");

        // You can send a JSON response or redirect as needed
        res.status(200).json({ success: true, updatedUser, updatedTrainingAttended });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async function deleteProfile(req, res) {
    const userID = req.params.userID;
    const attendedID = req.user.attendedID;
    try {
      // Retrieve the speaker information from the database
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Construct the absolute path to the file
      const filePath = `/Thesis/DepEd/SDOIN_Code/public/img/${user.userProfile}`;

      // Delete the actual file from the server
      await fs.unlink(filePath);

      // Use set to update the speakerBiodata field
      await User.updateOne({ _id: userID }, { $set: { userProfile: "" } });
      await TrainingAttended.updateMany(
        { attendedID: attendedID },
        { $set: { userProfile: "" } }
      );

      return res
        .status(200)
        .json({ success: true, message: "Profile deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  }
  // Use the deleteBiodata function as your route handler
  router.delete("/deleteProfile/:userID", deleteProfile);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/GetUser/:userID", async (req, res) => {
    try {
      const userID = req.params.userID;
      const users = await User.findById(userID);

      if (!users) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/DeleteUser/:userID", async (req, res) => {
    try {
      const userID = req.params.userID;

      // Retrieve the user information from the database
      const user = await User.findById(userID);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      // Construct the absolute paths to the files (assuming user has image property)
      const imagePath = `/Thesis/DepEd/SDOIN_Code/public/img/${user.userProfile}`;
      const deletePromises = [];

      if (user.userProfile) {
        try {
          await fs.access(imagePath);
          deletePromises.push(fs.unlink(imagePath));
        } catch (error) {
          console.log(`Image file not found: ${error.message}`);
        }
      }

      // Wait for all delete promises to complete
      await Promise.all(deletePromises);

      // Remove the document from the database
      const deletedRow = await User.findByIdAndRemove(userID);

      if (!deletedRow) {
        res.status(404).json({ success: false, message: "Row not found" });
      } else {
        req.flash("success_msg", "User Deleted Successfully");
        console.log("User Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/Get-School/:schoolID", async (req, res) => {
    try {
      const schoolID = req.params.schoolID;
      const school = await School_List.findById(schoolID);

      if (!school) {
        return res.status(404).json({ error: "School not found" });
      }

      res.json(school);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/Delete-School/:schoolID", async (req, res) => {
    try {
      const schoolID = req.params.schoolID;
      const deletedRow = await School_List.findByIdAndRemove(schoolID);

      if (!deletedRow) {
        res.status(404).send("Row not found");
      } else {
        req.flash("success_msg", "School Deleted Successfully");
        console.log("School Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.patch("/Edit-School/:schoolID", async (req, res) => {
    try {
      const schoolID = req.params.schoolID;
      const updateData = req.body;

      const updated = await School_List.findByIdAndUpdate(
        schoolID,
        updateData,
        {
          new: true,
        }
      );

      if (!updated) {
        res
          .status(404)
          .json({ success: false, message: "Document not found" });
      } else {
        req.flash(
          "success_msg",
          `School Updated Successfully: <b>${updated.SchoolName}</b>`
        );
        console.log("School Updated Successfully");
        res.status(200).json({ success: true, updated });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File Upload for the News Images
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/Thesis/DepEd/SDOIN_Code/public/news");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadNews = multer({
    storage: storage,
  }).single("newsImage");

  router.patch("/Edit_News/:newsID", uploadNews, async (req, res) => {
    try {
      const newsID = req.params.newsID;
      const updateData = req.body;
      // Use the file name if provided
      if (req.file) {
        updateData.newsImage = req.file ? req.file.filename : "";
      }

      console.log(updateData);
      const updatedDoc = await NewsContent.findByIdAndUpdate(
        newsID,
        updateData,
        {
          new: true,
        }
      );

      if (!updatedDoc) {
        res.status(404).json({ success: false, message: "Document not found" });
      } else {
        req.flash(
          "success_msg",
          `News Updated Successfully. News Title: <b>${updateData.newsTitle}</b>`
        );
        console.log("News Updated Successfully");
        res.status(200).json({ success: true, updatedDoc });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/GetNews/:newsID", async (req, res) => {
    try {
      const newsID = req.params.newsID;
      const news = await NewsContent.findById(newsID);

      if (!news) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(news);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/DeleteNews/:newsID", async (req, res) => {
    try {
      const newsID = req.params.newsID;

      // Retrieve the news information from the database
      const newsItem = await NewsContent.findById(newsID);
      if (!newsItem) {
        return res
          .status(404)
          .json({ success: false, message: "News item not found" });
      }

      // Construct the absolute paths to the files (assuming newsItem has imagePath property)
      const imagePath = `/Thesis/DepEd/SDOIN_Code/public/news/${newsItem.newsImage}`;

      // Delete the actual files from the server
      await fs.unlink(imagePath);

      // Remove the document from the database
      const deletedRow = await NewsContent.findByIdAndRemove(newsID);

      if (!deletedRow) {
        res.status(404).json({ success: false, message: "Row not found" });
      } else {
        // Emit a newsDeleted event to notify connected clients
        io.emit("newsDeleted", { newsID });

        req.flash("success_msg", "News Deleted Successfully");
        console.log("News Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/GetSpeaker/:speakerID", async (req, res) => {
    try {
      const speakerID = req.params.speakerID;
      const speaker = await SpeakerInfo.findById(speakerID);

      if (!speaker) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(speaker);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/DeleteSpeaker/:speakerID", async (req, res) => {
    try {
      const speakerID = req.params.speakerID;

      // Retrieve the speaker information from the database
      const speaker = await SpeakerInfo.findById(speakerID);
      if (!speaker) {
        return res
          .status(404)
          .json({ success: false, message: "Speaker not found" });
      }

      // Construct the absolute paths to the files
      const imagePath = `/Thesis/DepEd/SDOIN_Code/public/speaker/${speaker.speakerImage}`;
      const biodataPath = `/Thesis/DepEd/SDOIN_Code/public/speaker/${speaker.speakerBiodata}`;

      // Delete the actual files from the server if the paths are not empty
      const deletePromises = [];

      // Check if speaker.speakerImage is not empty and file exists
      if (speaker.speakerImage) {
        try {
          await fs.access(imagePath);
          deletePromises.push(fs.unlink(imagePath));
        } catch (error) {
          console.log(`Image file not found: ${error.message}`);
        }
      }

      // Check if speaker.speakerBiodata is not empty and file exists
      if (speaker.speakerBiodata) {
        try {
          await fs.access(biodataPath);
          deletePromises.push(fs.unlink(biodataPath));
        } catch (error) {
          console.log(`Biodata file not found: ${error.message}`);
        }
      }

      // Wait for all delete promises to complete
      await Promise.all(deletePromises);

      // Remove the document from the database
      const deletedRow = await SpeakerInfo.findByIdAndRemove(speakerID);

      if (!deletedRow) {
        res.status(404).json({ success: false, message: "Row not found" });
      } else {
        io.emit("speakerDelete", { speakerID });

        req.flash("success_msg", "Speaker Deleted Successfully");
        console.log("Speaker Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File Upload for the News Images
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/Thesis/DepEd/SDOIN_Code/public/speaker");
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

  router.patch("/Edit_Speaker/:speakerID", uploadSpeaker, async (req, res) => {
    try {
      const speakerID = req.params.speakerID;
      const updateData = req.body;

      // Check for speakerBiodata file
      if (req.files["speakerBiodata"]) {
        updateData.speakerBiodata = req.files["speakerBiodata"]
          ? req.files["speakerBiodata"][0].filename
          : "";
      }

      // Check for speakerImage file
      if (req.files["speakerImage"]) {
        updateData.speakerImage = req.files["speakerImage"]
          ? req.files["speakerImage"][0].filename
          : "";
      }

      console.log(updateData);
      const updateSpeaker = await SpeakerInfo.findByIdAndUpdate(
        speakerID,
        updateData,
        {
          new: true,
        }
      );

      if (!updateSpeaker) {
        res.status(404).json({ success: false, message: "Document not found" });
      } else {
        req.flash(
          "success_msg",
          `Speaker Updated Successfully. Speaker Name: <b>${updateData.speakerName}</b>`
        );
        console.log("Speaker Updated Successfully");
        res.status(200).json({ success: true, updateSpeaker });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async function deleteBiodata(req, res) {
    const speakerID = req.params.speakerID;

    try {
      // Retrieve the speaker information from the database
      const speaker = await SpeakerInfo.findById(speakerID);
      if (!speaker) {
        return res
          .status(404)
          .json({ success: false, message: "Speaker not found" });
      }

      // Construct the absolute path to the file
      const filePath = `/Thesis/DepEd/SDOIN_Code/public/speaker/${speaker.speakerBiodata}`;

      // Delete the actual file from the server
      await fs.unlink(filePath);
      // Use set to update the speakerBiodata field
      await SpeakerInfo.updateOne(
        { _id: speakerID },
        { $set: { speakerBiodata: "" } }
      );

      return res
        .status(200)
        .json({ success: true, message: "Biodata deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Server Error" });
    }
  }
  // Use the deleteBiodata function as your route handler
  router.delete("/deleteBiodata/:speakerID", deleteBiodata);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/getResources/:resourcesID", async (req, res) => {
    try {
      const resourcesID = req.params.resourcesID;
      const resources = await LearningResources.findById(resourcesID);

      if (!resources) {
        return res.status(404).json({ error: "Learning Resources not found" });
      }

      res.json(resources);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //File Upload for the Learning Resources
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/Thesis/DepEd/SDOIN_Code/public/resources");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadResources = multer({
    storage: storage,
  }).single("resourcesFile");

  router.patch(
    "/Edit_Resources/:resourcesID",
    uploadResources,
    async (req, res) => {
      try {
        const resourcesID = req.params.resourcesID;
        const updateData = req.body;
        // Use the file name if provided
        if (req.file) {
          updateData.resourcesFile = req.file ? req.file.filename : "";
        }

        console.log(updateData);
        const updatedDoc = await LearningResources.findByIdAndUpdate(
          resourcesID,
          updateData,
          {
            new: true,
          }
        );

        if (!updatedDoc) {
          res
            .status(404)
            .json({ success: false, message: "Document not found" });
        } else {
          req.flash(
            "success_msg",
            `Resources Updated Successfully. Resources Title: <b>${updateData.resourcesTitle}</b>`
          );
          console.log("Resources Updated Successfully");
          res.status(200).json({ success: true, updatedDoc });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
      }
    }
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/Delete_Resources/:resourcesID", async (req, res) => {
    try {
      const resourcesID = req.params.resourcesID;

      // Retrieve the news information from the database
      const resourcesItem = await LearningResources.findById(resourcesID);
      if (!resourcesItem) {
        return res
          .status(404)
          .json({ success: false, message: "News item not found" });
      }

      // Construct the absolute paths to the files (assuming newsItem has imagePath property)
      const filepath = `/Thesis/DepEd/SDOIN_Code/public/resources/${resourcesItem.resourcesFile}`;

      // Delete the actual files from the server
      await fs.unlink(filepath);

      // Remove the document from the database
      const deletedRow = await LearningResources.findByIdAndRemove(resourcesID);

      if (!deletedRow) {
        res.status(404).json({ success: false, message: "Row not found" });
      } else {
        // Emit a newsDeleted event to notify connected clients
        io.emit("newsDeleted", { resourcesID });

        req.flash("success_msg", "Resources Deleted Successfully");
        console.log("Resources Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/Get_Personal_Attended/:AttendID/:PersonalAttendedID", async (req, res) => {
    try {
      const AttendID = req.params.AttendID;
      const PersonalAttendedID = req.params.PersonalAttendedID;

      const attended_ID = await TrainingAttended.findById(AttendID);

      if (!attended_ID) {
        return res.status(404).json({ error: "Training not found" });
      }

      // Find the department within the array based on deptId
      const attendedData = attended_ID.credential.find(file => file._id.toString() === PersonalAttendedID);

      if (!attendedData) {
        return res.status(404).json({ error: "Training Not Found" });
      }

      res.json(attendedData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/Delete_Personal_Attended/:AttendID/:PersonalAttendedID", async (req, res) => {
    try {
      const AttendID = req.params.AttendID;
      const PersonalAttendedID = req.params.PersonalAttendedID;

      // Fetch the credential document to get the file path
      const credentialDocument = await TrainingAttended.findOne({
        _id: AttendID,
        "credential._id": PersonalAttendedID
      });

      if (!credentialDocument) {
        return res.status(404).send("Row not found");
      }

      // Get the file path from the credential document
      const fileName = credentialDocument.credential.find(cred => cred._id.toString() === PersonalAttendedID).trainingCertificate;
      const filePath = `/Thesis/DepEd/SDOIN_Code/public/attended/${fileName}`;

      // Delete the actual files from the server if the paths are not empty
      const deletePromises = [];

      // Check if speaker.speakerImage is not empty and file exists
      if (fileName) {
        try {
          await fs.access(filePath);
          deletePromises.push(fs.unlink(filePath));
        } catch (error) {
          console.log(`Image file not found: ${error.message}`);
        }
      }

      // Remove the credential from the document
      const deletedRow = await TrainingAttended.findByIdAndUpdate(
        AttendID,
        { $pull: { credential: { _id: PersonalAttendedID } } },
        { new: true }
      );

      if (!deletedRow) {
        res.status(404).send("Row not found");
      } else {
        req.flash("success_msg", "Training Deleted Successfully");
        console.log("Training Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/Get_Teachers_Attended/:AttendID", async (req, res) => {
    try {
      const AttendID = req.params.AttendID;
      const attended = await TrainingAttended.findById(AttendID);

      if (!attended) {
        return res.status(404).json({ error: "Learning Resources not found" });
      }

      res.json(attended);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/Delete_Teachers_Attended/:AttendID", async (req, res) => {
    try {
      const AttendID = req.params.AttendID;
      const deletedRow = await TrainingAttended.findByIdAndRemove(AttendID);

      if (!deletedRow) {
        res.status(404).send("Row not found");
      } else {
        req.flash("success_msg", "Teacher Conducted Training Deleted Successfully");
        console.log("Teacher Conducted Training Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "/Thesis/DepEd/SDOIN_Code/public/attended");
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },
  });

  var uploadCertificate = multer({
    storage: storage,
  }).single("trainingCertificate");

  router.patch("/Edit_Personal_Attended/:AttendID/:PersonalAttendedID", uploadCertificate, async (req, res) => {
    try {
      const AttendID = req.params.AttendID;
      const PersonalAttendedID = req.params.PersonalAttendedID;
      const updateData = req.body;
      console.log(updateData)

      if (req.file) {
        updateData.trainingCertificate = req.file ? req.file.filename : "";
      }

      const updatedDoc = await TrainingAttended.findOneAndUpdate(
        {
          _id: AttendID,
          "credential._id": PersonalAttendedID,
        },
        {
          $set: {
            "credential.$.trainingTitle": updateData.trainingTitle,
            "credential.$.trainingCertificate": updateData.trainingCertificate,
            "credential.$.trainingStart": updateData.trainingStart,
            "credential.$.trainingEnd": updateData.trainingEnd,
          },
        },
        {
          new: true,
        }
      );

      if (!updatedDoc) {
        res.status(404).json({ success: false, message: "Training Attended not Found" });
      } else {
        req.flash("success_msg", `Training Attended Updated Successfully: <b>${updateData.trainingTitle}</b>`);
        res.status(200).json({ success: true, updatedDoc });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/getConducted/:conductedID", async (req, res) => {
    try {
      const conductedID = req.params.conductedID;
      const conducted = await TrainingConducted.findById(conductedID);

      if (!conducted) {
        return res.status(404).json({ error: "Learning Resources not found" });
      }

      res.json(conducted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.patch( "/Edit_Conducted/:conductedID", async (req, res) => {
      try {
        const conductedID = req.params.conductedID;
        const updateData = req.body;
        console.log(updateData);
        const updated = await TrainingConducted.findByIdAndUpdate(
          conductedID,
          updateData,
          {
            new: true,
          }
        );

        if (!updated) {
          res
            .status(404)
            .json({ success: false, message: "Document not found" });
        } else {
          req.flash(
            "success_msg",
            `Conducted Training Updated Successfully. Training Title: <b>${updated.titleActivity}</b>`
          );
          console.log("Conducted Training Updated Successfully");
          res.status(200).json({ success: true, updated });
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
      }
    }
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.delete("/Delete_Conducted/:conductedID", async (req, res) => {
    try {
      const conductedID = req.params.conductedID;
      const deletedRow = await TrainingConducted.findByIdAndRemove(conductedID);

      if (!deletedRow) {
        res.status(404).send("Row not found");
      } else {
        req.flash("success_msg", "Conducted Training Deleted Successfully");
        console.log("Conducted Training Deleted Successfully");

        // Send a success response to the client
        res.status(200).json({ success: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  // Example endpoint to retrieve events from the database
  router.get("/events", async (req, res) => {
    try {
      // Fetch events from the database
      const events = await Event.find();
      res.json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  router.get("/getEvent/:eventID", async (req, res) => {
    try {
      const eventID = req.params.eventID;
      const events = await Event.findById(eventID);

      if (!events) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(events);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server Error" });
    }
  });

  router.patch("/editEvent/:eventID", async (req, res) => {
    try {
      const eventID = req.params.eventID;
      const updateData = req.body;

      const updated = await Event.findByIdAndUpdate(
        eventID,
        updateData,
        {
          new: true,
        }
      );

      if (!updated) {
        res
          .status(404)
          .json({ success: false, message: "Document not found" });
      } else {
        req.flash(
          "success_msg",
          `Event Updated Successfully. Event Title: <b>${updated.createTitle}</b>`
        );
        console.log("Event Updated Successfully");
        res.status(200).json({ success: true, updated });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  }
);

router.delete("/deleteEvent/:eventID", async (req, res) => {
  try {
    const eventID = req.params.eventID;
    const deletedRow = await Event.findByIdAndRemove(eventID);

    if (!deletedRow) {
      res.status(404).send("Row not found");
    } else {
      req.flash("success_msg", "Event Deleted Successfully");
      console.log("Event Deleted Successfully");

      // Send a success response to the client
      res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

  return router;
}
module.exports = socketRouter;
