const express = require('express');
const router = express.Router();

// Import from individual controller files
const {
  teacherlogin,
  ShopkeeperLogin,
  Login,
} = require('../Controller/authController');

const {
  EnrollerdCourses,
  ordercount,
  orderdetail,
  isbrilliant,
  getBrilliantCourses,
  uploadBrilliantNotes,
} = require('../Controller/studentController');

const {
  TeacherCoursesnotes,
  teacherenrollcourse,
  courseNotes,
  files,
  uploadCourseNotes,
  viewenrollcoursestudent,
  markbrilliant,
  getBrilliantStudentNotesRequest,
  rejectStudentNotes,
  approveStudentNotes,
} = require('../Controller/teacherController');

const {
  Stationery,
  Stationerygetbyid,
  editstationery,
  removestationery,
  addstationery,
  upload,
  stationerybuyrequest,
} = require('../Controller/stationeryController');

const {
  NotesPrintRequest,
  CreateNotePrintRequest,
  personalnoteprintorder,
  files: printFiles,
} = require('../Controller/printController');

const {
  getallorders,
  confirmorder,
  removeorder,
  getHistory,
  allordercount,
  updateorderstatus,
} = require('../Controller/orderController');

const {
  updatewalletamount,
    Wallet,
    transactions,
} = require('../Controller/walletController');

const {
  sendnotificationbyshopkeeper,
  receivednotification,
  removenotification,
} = require('../Controller/notificationController');

// Route for fetching users
router.get('/Login', Login);
router.get('/EnrolledCourses', EnrollerdCourses);
router.get('/TeacherCoursesnotes', TeacherCoursesnotes);
router.get('/NotesPrintRequestdetails', NotesPrintRequest);
router.get('/Wallet', Wallet);
router.get('/transactions',transactions)
router.get('/Stationery', Stationery);
router.get('/Stationery/:id', Stationerygetbyid);
router.put('/Stationery/:id', upload.single("image"), editstationery);
router.get('/ordercount', ordercount);
router.get('/orderdetail', orderdetail);
router.get('/getallorders',getallorders);
router.post('/NotesPrintRequest', CreateNotePrintRequest);
router.post('/updatewalletamount',updatewalletamount)
router.post('/stationerybuyrequest',stationerybuyrequest)
router.get('/isbrilliant',isbrilliant);
router.get('/getBrilliantCourses',getBrilliantCourses);
 
router.post('/addstationery', upload.single("image"), addstationery)
router.post('/uploadBrilliantNotes', upload.single("file"), uploadBrilliantNotes)
router.get('/getHistory',getHistory)
router.delete('/removestationery/:id',removestationery)

router.get('/ShopkeeperLogin', ShopkeeperLogin);

 router.post('/sendnotificationbyshopkeeper', sendnotificationbyshopkeeper);

router.put('/confirmorder', confirmorder);

router.get('/receivednotification', receivednotification);

router.delete('/removenotification',removenotification)

router.delete('/removeorder/:order_id',removeorder)

router.get('/allordercount',allordercount)

router.put('/updateorderstatus',updateorderstatus)



//teacher 
router.get('/teacherlogin',teacherlogin)
router.get('/teacherenrollcourse',teacherenrollcourse)
router.get('/courseNotes/:Course_no',courseNotes)
router.get('/viewenrollcoursestudent',viewenrollcoursestudent)
router.post('/personalnoteprintrequest',files.single("file"),personalnoteprintorder)
router.post('/uplodcoursenotes', files.single("file"), uploadCourseNotes);
router.post('/markbrilliant',markbrilliant);
router.get('/getBrilliantStudentNotesRequest',getBrilliantStudentNotesRequest);
router.put('/approveStudentNotes',approveStudentNotes);
router.put('/rejectStudentNotes',rejectStudentNotes);
module.exports = router;
