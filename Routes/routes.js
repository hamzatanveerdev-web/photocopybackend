const express = require('express');
const router = express.Router();

// Import from individual controller files
const {
  teacherlogin,
  ShopkeeperLogin,
  Login,
  registerShopkeeper,
 // verifyShopkeeperOtp,
} = require('../Controller/authController');

const {
  EnrollerdCourses,
  TeacherCoursesnotes,
  ordercount,
  orderdetail,
  isbrilliant,
  getBrilliantNotes,
  getBrilliantCourses,
  uploadBrilliantNotes,
  getallphotocopier,
  studentphotocopiers,
  studentphotocopiersget,
  deletestudentselectedphotocopier,
} = require('../Controller/studentController');

const {

  teacherenrollcourse,
  courseNotes,
  files,
  uploadCourseNotes,
  viewenrollcoursestudent,
  markbrilliant,
  getBrilliantStudentNotesRequest,
  rejectStudentNotes,
  approveStudentNotes,
  deletenotes,
  removeBrilliantStudent,
  countTeacherNotes,
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
  createNotification,
  sendnotification,
  receivednotification,
  removenotification,
} = require('../Controller/notificationController');


//admin
const {  addParent, getParents, deleteParent,loginadmin } = require('../Controller/adminController');

//parent
const {loginparent,getEnrolledChildren,addWalletAmount,getRecentTransactions } = require('../Controller/parent');

// Route for fetching users
router.post('/Login', Login);

router.get('/getallphotocopier', getallphotocopier);
router.post('/studentphotocopiers', studentphotocopiers);
router.get('/studentphotocopiersget', studentphotocopiersget);

router.delete('/deletestudentselectedphotocopier', deletestudentselectedphotocopier);
router.get('/EnrolledCourses', EnrollerdCourses);
router.get('/viewCoursesnotes',  TeacherCoursesnotes);
router.get('/NotesPrintRequestdetails', NotesPrintRequest); 
router.get('/Wallet', Wallet);
router.get('/transactions',transactions) 
router.get('/Stationery', Stationery);
router.get('/getBrilliantNotes',getBrilliantNotes)
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
router.post('/registerShopkeeper', registerShopkeeper);
//router.post('/verifyShopkeeperOtp', verifyShopkeeperOtp);

//router.post('/notifications', createNotification);
router.post('/sendnotification', sendnotification);

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
router.put('/removeBrilliantStudent',removeBrilliantStudent);
router.put('/rejectStudentNotes',rejectStudentNotes);
router.delete('/deletenotes',deletenotes);
router.get('/teachernotescount',countTeacherNotes);

module.exports = router;

      

//admin routes
router.post('/adminlogin', loginadmin);
router.post('/addparent', addParent);
router.get('/parents', getParents);
router.delete('/parents/:id', deleteParent);


//parent routes
router.post('/parentlogin', loginparent);
router.get('/enrolledchildren', getEnrolledChildren);
router.post('/addwalletamount', addWalletAmount);
router.get('/recenttransactions', getRecentTransactions); 






