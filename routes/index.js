const express = require("express");
const User = require("../models/Users");
const NewsContent = require("../models/NewsContent");
const SpeakerInfo = require("../models/SpeakerInfo");
const LearningResources = require("../models/LearningResources");
const TrainingConducted = require("../models/TrainingsConducted");
const TrainingsAttended = require("../models/TrainingsAttended");
const School_List = require("../models/SchoolList");
const Event = require("../models/EventCalendar");

const { ensureAuthenticated, forwardAuthenticated } = require("../config/auth");

function socketRouter(io) {
  const router = express.Router();

  // router.get("/testing", ensureAuthenticated, async (req, res) => {
  //   try {
  //     const userID = req.user._id; //Unique ID of the user
  //     const user = await User.findById(userID, "userSchool").populate('userSchool', 'SchoolName');
  //     const SchoolName = { userSchool: user.userSchool ? user.userSchool.SchoolName : null, };
  //     const userSchool = await School_List.find({}, "SchoolName");
  //     const news = await NewsContent.find(
  //       {},
  //       "_id newsTitle newsContent newsImage"
  //     ); // Fetch user documents and select the 'userDept' field
  //     res.render("ui/testing", {
  //       user: req.user,
  //       userSchool: SchoolName,
  //       news: news,
  //       userSchoolList: userSchool,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send("Server Error");
  //   }
  // });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const isAdmin = (req, res, next) => {
    if (req.user && req.user.userType === "Admin") {
      // User is an admin, proceed to the next middleware or route handler
      next();
    } else {
      // User is not an admin, respond with an error or redirect to an unauthorized page
      req.flash("error_msg", "Error!! Cannot Access the Site!!");
      res.redirect("/Dashboard");
    }
  };
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //Login ROUTE
  router.get("/login", forwardAuthenticated, (req, res) => res.render("login"));
  //This is the landing page of the Admin when He/She going to Log-in

  router.get("/calendar", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");

      const event = await Event.find(
        {},
        "_id createTitle createDetails createStart createEnd"
      ).populate("userSchool", "SchoolName");
      const eventList = event.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      res.render("Content/Calendar", {
        user: req.user,
        userSchool: SchoolName,
        event: eventList,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  router.get("/schoolCalendar", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );

      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };

      const userSchool = await School_List.find({}, "SchoolName");
      const event = await Event.find(
        {},
        "_id createTitle createDetails createStart createEnd "
      ).populate("userSchool", "SchoolName");

      const eventList = event.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      res.render("Content/CalendarSchool", {
        user: req.user,
        userSchool: SchoolName,
        event: eventList,
        userSchoolList: userSchool,
        SameSchool: SameSchool.userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  //This is the landing page of the Admin when He/She going to Log-in
  router.get("/dashboard", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");
      const news = await NewsContent.find(
        {},
        "_id newsTitle newsContent newsImage"
      ).populate("userSchool", "SchoolName");

      const newsList = news.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      res.render("Content/Dashboard", {
        user: req.user,
        userSchool: SchoolName,
        news: newsList,
        userSchoolList: userSchool,
        SameSchool: SameSchool.userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  router.get("/SchoolDashboard", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");
      const news = await NewsContent.find(
        {},
        "_id newsTitle newsContent newsImage"
      ).populate("userSchool", "SchoolName");
      const newsList = news.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));
      res.render("Content/DashboardSchool", {
        user: req.user,
        userSchool: SchoolName,
        news: newsList,
        userSchoolList: userSchool,
        SameSchool: SameSchool.userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/resources", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user

      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");

      const resources = await LearningResources.find(
        {},
        "_id resourcesTitle whoAdded resourcesFile"
      ).populate("userSchool", "SchoolName");

      const resourcesList = resources.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));
      res.render("Content/LearningResources", {
        user: req.user,
        userSchool: SchoolName,
        resources: resourcesList,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  router.get("/SchoolResources", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const CurrentlyLoggedIn = req.user.userName; //Get the Name of the person who logged In
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };

      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };

      const userSchool = await School_List.find({}, "SchoolName");

      const resources = await LearningResources.find(
        {},
        "_id resourcesTitle whoAdded resourcesFile"
      ).populate("userSchool", "SchoolName");

      const resourcesList = resources.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      res.render("Content/LearningResourcesSchools", {
        user: req.user,
        userSchool: SchoolName,
        resources: resourcesList,
        userSchoolList: userSchool,
        SameSchool: SameSchool.userSchool,
        CurrentlyLoggedIn: CurrentlyLoggedIn,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/speakers", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");
      const speaker = await SpeakerInfo.find(
        {},
        "_id speakerName speakerPosition speakerSchool speakerDistrict speakerBiodata speakerImage"
      ); // Fetch user documents and select the 'userDept' field
      res.render("Content/Speakers", {
        user: req.user,
        userSchool: SchoolName,
        speaker: speaker,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/conducted", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");
      const conducted = await TrainingConducted.find(
        {},
        "_id titleActivity programOwner output dateConducted remarks"
      );
      res.render("Content/TrainingsConducted", {
        user: req.user,
        userSchool: SchoolName,
        conducted: conducted,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/DivisionsTraining", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user

      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );

      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };

      const attendedID = req.user.attendedID; // Attended Id of the user who will Logged In

      const DivisionData = await User.find(
        {},
        "_id userName userSchool userProfile attendedID"
      ).populate("userSchool", "SchoolName");
      const DivisionDataList = DivisionData.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      const attendedDivision = await TrainingsAttended.find(
        {},
        "_id userName userSchool userPosition userProfile attendedID credential trainingTitle trainingCertificate"
      ).populate("userSchool", "SchoolName");

      const attendedDivisionList = attendedDivision.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      const attended = await TrainingsAttended.find(
        { attendedID },
        "_id userName userSchool userPosition userProfile attendedID credential trainingTitle trainingCertificate"
      )
        .populate("userSchool", "SchoolName")
        .exec();

      const attendedList = attended.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));
      const userSchool = await School_List.find({}, "SchoolName");

      res.render("Content/TrainingDivision", {
        user: req.user,
        userSchool: SameSchool,
        attended: attendedList,
        attendedID: attendedID,
        attendedDivision: attendedDivisionList,
        SameSchool: SameSchool.userSchool,
        DivisionList: DivisionDataList,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  router.get(
    "/AddDivisionsTraining",
    ensureAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const userID = req.user._id; //Unique ID of the user

        const user = await User.findById(userID, "userSchool").populate(
          "userSchool",
          "SchoolName"
        );

        const SameSchool = {
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        };

        const attendedID = req.user.attendedID; // Attended Id of the user who will Logged In
        const SchoolHeadID = req.user.attendedID; // The Attended ID of the School Head will be used to filter out the list of Attended List

        const TeachersData = await User.find(
          {},
          "_id userName userSchool userProfile attendedID"
        ).populate("userSchool", "SchoolName");
        const TeachersDataList = TeachersData.map((user) => ({
          ...user.toObject(),
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        }));

        const attendedSH = await TrainingsAttended.find(
          {},
          "_id userName userSchool userProfile userPosition attendedID credential trainingTitle trainingCertificate trainingStart trainingEnd"
        ).populate("userSchool", "SchoolName");

        const attendedSHList = attendedSH.map((user) => ({
          ...user.toObject(),
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        }));

        const attended = await TrainingsAttended.find(
          { attendedID },
          "_id userName userSchool userProfile userPosition attendedID credential trainingTitle trainingCertificate trainingStart trainingEnd"
        )
          .populate("userSchool", "SchoolName")
          .exec();

        const attendedList = attended.map((user) => ({
          ...user.toObject(),
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        }));
        const userSchool = await School_List.find({}, "SchoolName");

        res.render("Content/AddDivisionsTraining", {
          user: req.user,
          userSchool: SameSchool,
          attended: attendedList,
          attendedSH: attendedSHList,
          SameSchool: SameSchool.userSchool,
          SchoolHeadID: SchoolHeadID,
          TeacherList: TeachersDataList,
          userSchoolList: userSchool,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    }
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/TeachersTraining", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user

      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );

      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };

      const attendedID = req.user.attendedID; // Attended Id of the user who will Logged In
      const SchoolHeadID = req.user.attendedID; // The Attended ID of the School Head will be used to filter out the list of Attended List

      const TeachersData = await User.find(
        {},
        "_id userName userSchool userProfile attendedID"
      ).populate("userSchool", "SchoolName");
      const TeachersDataList = TeachersData.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      const attendedSH = await TrainingsAttended.find(
        {},
        "_id userName userSchool userProfile userPosition attendedID credential trainingTitle trainingCertificate trainingStart trainingEnd"
      ).populate("userSchool", "SchoolName");

      const attendedSHList = attendedSH.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      const attended = await TrainingsAttended.find(
        { attendedID },
        "_id userName userSchool userProfile userPosition attendedID credential trainingTitle trainingCertificate trainingStart trainingEnd"
      )
        .populate("userSchool", "SchoolName")
        .exec();

      const attendedList = attended.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));
      const userSchool = await School_List.find({}, "SchoolName");

      res.render("Content/TrainingTeacher", {
        user: req.user,
        userSchool: SameSchool,
        attended: attendedList,
        attendedSH: attendedSHList,
        SameSchool: SameSchool.userSchool,
        SchoolHeadID: SchoolHeadID,
        TeacherList: TeachersDataList,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  const isSchoolHead = (req, res, next) => {
    if (req.user && req.user.userType === "School Head") {
      // User is an admin, proceed to the next middleware or route handler
      next();
    } else {
      // User is not an admin, respond with an error or redirect to an unauthorized page
      req.flash("error_msg", "Error!! Cannot Access the Site!!");
      res.redirect("/Dashboard");
    }
  };

  router.get(
    "/AddTeachersTraining",
    ensureAuthenticated,
    isSchoolHead,
    async (req, res) => {
      try {
        const userID = req.user._id; //Unique ID of the user

        const user = await User.findById(userID, "userSchool").populate(
          "userSchool",
          "SchoolName"
        );

        const SameSchool = {
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        };

        const attendedID = req.user.attendedID; // Attended Id of the user who will Logged In
        const SchoolHeadID = req.user.attendedID; // The Attended ID of the School Head will be used to filter out the list of Attended List

        const TeachersData = await User.find(
          {},
          "_id userName userSchool userProfile attendedID"
        ).populate("userSchool", "SchoolName");
        const TeachersDataList = TeachersData.map((user) => ({
          ...user.toObject(),
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        }));

        const attendedSH = await TrainingsAttended.find(
          {},
          "_id userName userSchool userProfile userPosition attendedID credential trainingTitle trainingCertificate trainingStart trainingEnd"
        ).populate("userSchool", "SchoolName");

        const attendedSHList = attendedSH.map((user) => ({
          ...user.toObject(),
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        }));

        const attended = await TrainingsAttended.find(
          { attendedID },
          "_id userName userSchool userProfile userPosition attendedID credential trainingTitle trainingCertificate trainingStart trainingEnd"
        )
          .populate("userSchool", "SchoolName")
          .exec();

        const attendedList = attended.map((user) => ({
          ...user.toObject(),
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        }));
        const userSchool = await School_List.find({}, "SchoolName");

        res.render("Content/AddTeachersTraining", {
          user: req.user,
          userSchool: SameSchool,
          attended: attendedList,
          attendedSH: attendedSHList,
          SameSchool: SameSchool.userSchool,
          SchoolHeadID: SchoolHeadID,
          TeacherList: TeachersDataList,
          userSchoolList: userSchool,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    }
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/PersonalTraining", ensureAuthenticated, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user

      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const userSchool = await School_List.find({}, "SchoolName");
      const SameSchool = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };

      const attendedID = req.user.attendedID; // Attended Id of the user who will Logged In

      const attended = await TrainingsAttended.find(
        { attendedID },
        "_id userName userSchool userProfile attendedID credential trainingTitle trainingCertificate"
      )
        .populate("userSchool", "SchoolName")
        .exec();

      const attendedList = attended.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      res.render("Content/TrainingPersonal", {
        user: req.user,
        attended: attendedList,
        userSchool: SameSchool,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  router.get("/UserList", ensureAuthenticated, isAdmin, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");

      const userList = await User.find(
        {},
        "_id userProfile userName userSchool userEmail userType userPosition"
      ).populate("userSchool", "SchoolName");

      // Modify the userList to extract only SchoolName
      const modifiedUserList = userList.map((user) => ({
        ...user.toObject(),
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      }));

      res.render("Content/UserList", {
        user: req.user,
        userSchool: SchoolName,
        UserList: modifiedUserList,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get(
    "/CreateAccount",
    ensureAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const userID = req.user._id; //Unique ID of the user
        const user = await User.findById(userID, "userSchool").populate(
          "userSchool",
          "SchoolName"
        );
        const SchoolName = {
          userSchool: user.userSchool ? user.userSchool.SchoolName : null,
        };
        const userSchool = await School_List.find({}, "SchoolName");

        const userSchoolList = await School_List.find({}, "SchoolName");
        res.render("Content/CreateAccount", {
          user: req.user,
          userSchool: SchoolName,
          userSchoolList: userSchoolList,
          userSchoolList: userSchool,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
      }
    }
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  router.get("/SchoolList", ensureAuthenticated, isAdmin, async (req, res) => {
    try {
      const userID = req.user._id; //Unique ID of the user
      const user = await User.findById(userID, "userSchool").populate(
        "userSchool",
        "SchoolName"
      );
      const SchoolName = {
        userSchool: user.userSchool ? user.userSchool.SchoolName : null,
      };
      const userSchool = await School_List.find({}, "SchoolName");
      const school = await School_List.find({}, "_id SchoolName"); // Fetch user documents and select the 'userDept' field
      res.render("Content/SchoolList", {
        user: req.user,
        userSchool: SchoolName,
        SchoolList: school,
        userSchoolList: userSchool,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  });

  return router;
}
module.exports = socketRouter;
