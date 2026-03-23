const express = require('express');
const router = express.Router();
const { Login,EnrollerdCourses,TeacherCoursesnotes,Stationery,Wallet ,NotesPrintRequest} = require('../Controller/controller');

// Route for fetching users
router.get('/Login', Login);
router.get('/EnrolledCourses', EnrollerdCourses);
router.get('/TeacherCoursesnotes', TeacherCoursesnotes);
router.get('/NotesPrintRequest', NotesPrintRequest);
router.get('/Wallet', Wallet);
router.get('/Stationery', Stationery);
 

module.exports = router;