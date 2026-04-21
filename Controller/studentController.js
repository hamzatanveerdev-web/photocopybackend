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
    FROM Crsdtl c
    JOIN Accgpa a 
        ON c.REG_NO = a.REG_NO 
        AND c.Semester_no = a.Semester_no
    WHERE c.REG_NO = '${regno}'
      AND a.Semester_no = (
          SELECT MAX(Semester_no)
          FROM Accgpa
          WHERE REG_NO='${regno}'
      )
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

  .query(`SELECT  o.order_id,
        COALESCE(s.St_firstname + ' ' + s.St_lastname, e.Emp_firstname + ' ' + e.Emp_lastname) AS fullname,
        o.user_id, o.created_at, o.status,o.user_type,
        COALESCE(ns.title, pn.title) AS title,
        COALESCE(ns.Course_no, '-') AS course_no,
        COALESCE(ns.week_no, '-') AS week_no,
        n.copies,
        n.color_mode,
        n.print_sides,
        n.pickup_time,
        CASE 
            WHEN ns.note_id IS NOT NULL THEN 'Course Note'
            WHEN pn.personal_note_id IS NOT NULL THEN 'Personal Note'
           
        END AS note_type
    FROM ORDERS o
    INNER JOIN Note_Print_detail n ON o.order_id = n.order_id
    LEFT JOIN STMTR s ON s.Reg_No = o.user_id
    LEFT JOIN EMPMTR e ON e.Emp_no = o.user_id
    LEFT JOIN Notes ns ON ns.note_id = n.note_id
    LEFT JOIN PersonalNotes pn ON pn.personal_note_id = n.personal_note_id
    WHERE o.user_id='${user_id}'
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
     insert into brilliantStudentNotes (StudentId, CourseId, TeacherId, semester, FilePath,week_no,no_of_pages, Title, Status,notify_std)
     values ('${reg_no}', '${Course_no}', '${Emp_no}', ${semester_no}, '${file}', '${week_no}', '${no_of_pages}', '${title}', 'Pending','${notify_students}')
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
module.exports = {
  EnrollerdCourses,
  ordercount,
  orderdetail,
  isbrilliant,
  getBrilliantCourses,
  uploadBrilliantNotes,
};
