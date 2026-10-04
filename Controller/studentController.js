const sql = require("mssql/msnodesqlv8");
const { poolPromise } = require("../db");


// student course data get function
async function EnrollerdCourses(req, res) {
  const regno = req.query.reg_no;
  try {
    console.log(regno);
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
    SELECT c.REG_NO, a.SEM_STATUS,c.Course_no,c.SECTION,c.CrsSemNo,(SELECT TOP 1 Course_desc FROM CRSMTR cr
         WHERE cr.Course_no = c.Course_no) AS Course_desc,a.Semester_no,c.DISCIPLINE
    FROM Crsdtl c JOIN Accgpa a  ON c.REG_NO = a.REG_NO  AND c.Semester_no = a.Semester_no  WHERE c.REG_NO = '${regno}'
      AND a.Semester_no = (SELECT MAX(Semester_no) FROM Accgpa  WHERE REG_NO='${regno}')
    `);
    if (result.recordset.length > 0) {
      res.json({
        success: true,
        message: "Courses fetched successfully",
        data: result.recordset,
      });
    } else {
      res.json({
        success: false,
        message: "No courses found for this student",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}


// teacher course data get function
async function TeacherCoursesnotes(req, res) {
  const courseNo = req.query.Course_no;
  const section = req.query.SECTION;
  const DISCIPLINE = req.query.DISCIPLINE; 
  const sem_no = req.query.Semester_no;


  console.log(courseNo, section, DISCIPLINE, sem_no);

  if (!courseNo || !section || !DISCIPLINE || !sem_no) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request().query`
          SELECT DISTINCT a.COURSE_NO,n.file_url,n.week_no,n.no_of_pages,n.title,n.note_id,e.Emp_no,
                e.Emp_firstname + ' ' + e.Emp_lastname AS Teacher_Name FROM ALLOCATE a 
                JOIN EMPMTR e ON e.Emp_no = a.Emp_no
          JOIN Notes n On a.EMP_NO=n.Emps_no
          and n.Course_no=a.COURSE_NO
          and n.Regs_No IS null
                WHERE a.COURSE_NO = ${courseNo}
                AND a.SECTION = ${section}
                AND a.DISCIPLINE = ${DISCIPLINE}
                AND a.SEMESTER_NO = ${sem_no}
         `;
   

         console.log("result---------------", result);

         const studentnotesfind=await pool.request().query(`
          
          select bsn.Course_no,bsn.note_id,bsn.FilePath ,bsn.StudentId,s.st_firstname+' '+s.st_lastname as fullname,s.Final_course,s.Section, bsn.TeacherId,bsn.week_no,bsn.no_of_pages ,bsn.title,bsn.semester  from brilliantStudentNotes bsn left  join STMTR s on s.Reg_no=bsn.StudentId   where Course_no='${courseNo}' and bsn.Status='Approved'
          `)
    res.json({
      success: true,
      message: "Courses fetched successfully",
      teachernotes: result.recordset,
       studentnotes:studentnotesfind.recordset
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }   
}

const ordercount = async (req, res) => {
  const user_id = req.query.user_id;

  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
                SELECT COUNT(*) AS total_orders 
                FROM ORDERS 
                WHERE user_id ='${user_id}'
                and status<>'Delivered'
            `);
    return res.json({
      success: true,
      message: "Order status fetched successfully",
      data: result.recordset[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const orderdetail = async (req, res) => {
  const user_id = req.query.user_id;

  try {
    console.log("user_id order detail", user_id);
    const pool = await poolPromise;

    const result = await pool.request()

  .query(`SELECT  
    o.order_id,
    COALESCE(s.St_firstname + ' ' + s.St_lastname, e.Emp_firstname + ' ' + e.Emp_lastname) AS fullname,
    o.user_id,
    o.created_at,
    o.status,
    o.user_type,
    ns.file_url,

    COALESCE(ns.title, pn.title, bs.title) AS title,
    COALESCE(ns.Course_no, '-') AS course_no,
    COALESCE(ns.week_no, '-') AS week_no,

    n.copies,
    n.color_mode,
    n.print_sides,
    n.pickup_time,

    CASE 
        WHEN n.teacher_note_id IS NOT NULL THEN 'Course Note'
        WHEN n.student_note_id IS NOT NULL THEN 'Student Note'
        WHEN n.personal_note_id IS NOT NULL THEN 'Personal Note'
        ELSE 'Unknown'
    END AS note_type

FROM ORDERS o
INNER JOIN Note_Print_detail n ON o.order_id = n.order_id

LEFT JOIN STMTR s ON s.Reg_No = o.user_id
LEFT JOIN EMPMTR e ON e.Emp_no = o.user_id

LEFT JOIN Notes ns ON ns.note_id = n.teacher_note_id
LEFT JOIN brilliantStudentNotes bs ON bs.note_id = n.student_note_id
LEFT JOIN PersonalNotes pn ON pn.personal_note_id = n.personal_note_id

WHERE o.user_id = '${user_id}'
  AND o.status NOT IN ('rejected', 'delivered')

ORDER BY o.created_at DESC;

`);
    const resultdata = await pool.request().query(`
        SELECT 
    o.order_id,
    o.user_type,
    o.status,
    o.order_type,
    o.created_at,
    ISNULL((
        SELECT 
            oi.id,
            oi.quantity,
            s.name,
            oi.amount,
            s.product_img
        FROM ORDER_ITEMS oi
        LEFT JOIN Stationery s ON s.product_id = oi.item_id
        WHERE oi.order_id = o.order_id
        FOR JSON PATH
    ), '[]') AS items
FROM ORDERS o
WHERE o.user_id = '${user_id}'
  AND o.status <> 'delivered'
   AND o.order_type = 'stationery'
ORDER BY o.order_id;

        `);

    const products = resultdata.recordset.map((item) => {
      const itemsArray = JSON.parse(item.items);

      const updatedItems = itemsArray.map((prod) => ({
        ...prod,
        imagePath: `http://localhost:3000${prod.product_img}`,
      }));

      return {
        ...item,
        items: updatedItems,
      };
    });

    return res.json({
      success: true,
      message: "Order details fetched successfully",
      notedata: result.recordset,
      stationerydata: products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const isbrilliant = async (req, res) => {
  const reg_no = req.query.reg_no;


  if (!reg_no) {
    return res.status(400).json({
      success: false,
      message: "Registration number required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM BrilliantStudents WHERE StudentId = '${reg_no}'
    `);
      console.log(result)
    if (result.recordset.length > 0) {
      return res.json({
        success: true,
        isBrilliant: true,
        message: "Student is brilliant",
        data: result.recordset[0],
      });
    } else {
      return res.json({
        success: true,
        isBrilliant: false,
        message: "Student is not brilliant",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
//brilliant student ko jin courses ma allow kya ha notes upload ka lya wo course get hon ga 
const getBrilliantCourses = async (req, res) => {
  const reg_no = req.query.reg_no;
  

  if (!reg_no) {
    return res.status(400).json({
      success: false,
      message: "Registration number required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT CourseId ,TeacherId ,title,Semester_No FROM BrilliantStudents b join course c on b.CourseId = c.course_no WHERE StudentId = '${reg_no}'
    `);
      console.log(result)
    if (result.recordset.length > 0) {
      return res.json({
        success: true,
      isBrilliant: true,
        
        message: "Student is brilliant",
        data: result.recordset,
      });
    } else {
      return res.json({
        success: true,
        isBrilliant: false,
        message: "Student is not brilliant",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
//upload brilliabt student notes 

const uploadBrilliantNotes = async (req, res) => {
  const { title, Course_no, week_no, no_of_pages, reg_no, notify_students,Emp_no,semester_no } = req.body;
  const file = req.file.filename;
  if (!title || !Course_no || !week_no || !no_of_pages || !reg_no || !notify_students || !Emp_no || !semester_no) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }
  if(!file){
    return res.status(400).json({
      success: false,
      message: "File is required",
    });
  }
  try{
     const pool =await poolPromise; 
  
     const result = await pool.request().query(`
     insert into brilliantStudentNotes (StudentId, Course_no, TeacherId, semester, FilePath,week_no,no_of_pages, title, Status,notify_std)
     values ('${reg_no}', '${Course_no}', '${Emp_no}', ${semester_no}, '${file}', '${week_no}', '${no_of_pages}', '${title}', 'Pending','${notify_students}')
     `);
     const studentname=await pool.request().query(`
      select st_firstname+' '+st_lastname as name from STMTR where reg_no='${reg_no}'`);
      const name =studentname.recordset[0].name;

    const noteMessage = `${name} has sent a request to approve the note "${title}" for Course ${Course_no}`;
     await pool
       .request()
       .input("receiver_id", sql.VarChar(50), Emp_no)
       .input("receiver_role", sql.VarChar(20), "teacher")
       .input("sender_id", sql.VarChar(50), reg_no)
       .input("sender_role", sql.VarChar(20), "student")
       .input("notification_type", sql.VarChar(50), "NOTE_REQUEST")
       .input("title", sql.VarChar(200), "Note Approval Request")
       .input("message", sql.VarChar(500), noteMessage)
       .input("reference_id", sql.Int, null)
       .input("reference_type", sql.VarChar(50), "NOTE")
       .input("is_read", sql.Bit, 0).query(`
         INSERT INTO Notifications (
           receiver_id, receiver_role, sender_id, sender_role,
           notification_type, title, message, reference_id, reference_type, is_read
         )
         VALUES (
           @receiver_id, @receiver_role, @sender_id, @sender_role,
           @notification_type, @title, @message, @reference_id, @reference_type, @is_read
         );
       `);

     return res.json({
      success: true,
      message: "Notes uploaded successfully",
      data: result.recordset,
     });
  }catch(err){
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
const getBrilliantNotes = async (req, res) => {
  const reg_no = req.query.reg_no;

  if (!reg_no) {
    return res.status(400).json({
      success: false,
      message: "Registration number required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT distinct bsn.*, c.Course_desc, e.Emp_firstname + ' ' + e.Emp_lastname AS TeacherName
      FROM brilliantStudentNotes bsn
      LEFT JOIN CRSMTR c ON c.course_no = bsn.Course_no
      LEFT JOIN EMPMTR e ON e.Emp_no = bsn.TeacherId
      WHERE bsn.StudentId = '${reg_no}'
      ORDER BY bsn.CreatedAt DESC
    `);

    return res.json({
      success: true,
      message: "Brilliant student notes fetched successfully",
      data: result.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getallphotocopier = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT id, photocopier_name, shop_name,address,phone FROM Photocopier
    `);
    return res.json({
      success: true,
      message: "Photocopiers fetched successfully",
      data: result.recordset,
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }

};

//add student photocopier selection list in db 
const studentphotocopiers= async (req,res)=>{

  const {reg_no,photocopier_id,user_type}=req.body;
  if (!reg_no || !photocopier_id || !user_type) {
    return res.status(400).json({
      success: false,
      message: "Registration number, photocopier id, and user type required",
    });
  }
  try {
    const pool = await poolPromise;
    await pool.request().query(` 
      INSERT INTO usersphotocopiers (user_ids, photocopier_id, user_type)
      VALUES ('${reg_no}', '${photocopier_id}', '${user_type}')
    `); 
    return res.json({
      success: true,
      message: "Photocopier selection saved successfully",
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

const studentphotocopiersget= async (req,res)=>{
  const reg_no=req.query.reg_no;
  const user_type=req.query.user_type;
  if (!reg_no || !user_type) {
    return res.status(400).json({
      success: false,
      message: "Registration number and user type required",
    });
  }
  try {


    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT p.id,
       p.shop_name
      FROM Photocopier p
      INNER JOIN usersphotocopiers up ON p.id = up.photocopier_id
      WHERE up.user_ids = '${reg_no}' AND up.user_type = '${user_type}'
    `);
    return res.json({
      success: true,

      message: "Photocopiers fetched successfully",
      data: result.recordset,
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

const deletestudentselectedphotocopier= async (req,res)=>{
  const reg_no=req.query.reg_no;
  const photocopier_id=req.query.photocopier_id;
  const user_type=req.query.user_type;
  if (!reg_no || !photocopier_id || !user_type) {
    return res.status(400).json({
      success: false,
      message: "Registration number, photocopier id, and user type required",
    });
  }
  try {
    const pool = await poolPromise; 
    await pool.request().query(` 
      DELETE FROM usersphotocopiers WHERE user_ids = '${reg_no}' AND photocopier_id = '${photocopier_id}' AND user_type = '${user_type}'
    `); 
    return res.json({
      success: true,
      message: "Photocopier selection deleted successfully",
    });
  }
  catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}


module.exports = {
    TeacherCoursesnotes,
  EnrollerdCourses,
  ordercount,
  orderdetail,
  isbrilliant,
  getBrilliantCourses,
  uploadBrilliantNotes,
  getBrilliantNotes,
  getallphotocopier,
  studentphotocopiers,
  deletestudentselectedphotocopier,
  studentphotocopiersget
};
