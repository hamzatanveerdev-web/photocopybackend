const express = require('express');
const router = express.Router();
const { Login,EnrollerdCourses,TeacherCoursesnotes,Stationery,Wallet ,NotesPrintRequest,CreateNotePrintRequest,updatewalletamount,orderstatus} = require('../Controller/controller');

// Route for fetching users
router.get('/Login', Login);
router.get('/EnrolledCourses', EnrollerdCourses);
router.get('/TeacherCoursesnotes', TeacherCoursesnotes);
router.get('/NotesPrintRequestdetails', NotesPrintRequest);
router.get('/Wallet', Wallet);
router.get('/Stationery', Stationery);
router.get('/orderstatus', orderstatus);

router.post('/NotesPrintRequest', CreateNotePrintRequest);
router.post('/updatewalletamount',updatewalletamount)

 

module.exports = router;