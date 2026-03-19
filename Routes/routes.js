const express = require('express');
const router = express.Router();
const { Login,EnrollerdCourses,TeacherCoursesnotes } = require('../Controller/controller');

// Route for fetching users
router.get('/Login', Login);
router.get('/EnrolledCourses', EnrollerdCourses);
router.post('/TeacherCoursesnotes', TeacherCoursesnotes);


module.exports = router;