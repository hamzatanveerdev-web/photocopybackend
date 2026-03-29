const express = require('express');
const router = express.Router();
const { Login,EnrollerdCourses,TeacherCoursesnotes,Stationery,Wallet ,NotesPrintRequest,CreateNotePrintRequest,updatewalletamount,ordercount,orderdetail,stationerybuyrequest,ShopkeeperLogin,addstationery,upload,getallorders,confirmorder,
    sendnotificationbyshopkeeper,receivednotification,removenotification,removeorder,allordercount,teacherlogin
} = require('../Controller/controller');

// Route for fetching users
router.get('/Login', Login);
router.get('/EnrolledCourses', EnrollerdCourses);
router.get('/TeacherCoursesnotes', TeacherCoursesnotes);
router.get('/NotesPrintRequestdetails', NotesPrintRequest);
router.get('/Wallet', Wallet);
router.get('/Stationery', Stationery);
router.get('/ordercount', ordercount);
router.get('/orderdetail', orderdetail);
router.get('/getallorders',getallorders);
router.post('/NotesPrintRequest', CreateNotePrintRequest);
router.post('/updatewalletamount',updatewalletamount)
router.post('/stationerybuyrequest',stationerybuyrequest)

router.post('/addstationery', upload.single("image"), addstationery)

router.get('/ShopkeeperLogin', ShopkeeperLogin);

 router.post('/sendnotificationbyshopkeeper', sendnotificationbyshopkeeper);

router.put('/confirmorder', confirmorder);

router.get('/receivednotification', receivednotification);

router.delete('/removenotification',removenotification)

router.delete('/removeorder/:order_id',removeorder)

router.get('/allordercount',allordercount)

//teacher
router.get('/teacherlogin',teacherlogin)

module.exports = router;