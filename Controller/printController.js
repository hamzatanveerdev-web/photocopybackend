const { poolPromise } = require("../db");
const multer = require("multer");
const fs = require("fs");

const filesstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const files = multer({ storage: filesstorage });

const NotesPrintRequest = async (req, res) => {
  const course_no = req.query.course_no;
  const note_id = req.query.note_id;
  try {
    console.log(course_no, note_id);
    const pool = await poolPromise;

    const result = await pool.request()
      .query`select distinct n.note_id, n.title ,c.Course_desc, n.week_no,n.no_of_pages , e.Emp_firstname+''+e.Emp_lastname as fullname from Notes n join EMPMTR e on n.Emps_no=e.Emp_no join CRSMTR c on c.Course_no=n.Course_no where n.Course_no=${course_no} and note_id=${note_id}`;
    if (result.recordset.length > 0) {
      console.log(result.recordset[0]);
      res.json({
        success: true,
        message: "Note details fetched successfully",
        data: result.recordset[0],
      });
    } else {
    const result = await pool.request()
      .query`select distinct n.note_id as note_id, n.title as title ,c.Course_desc, n.week_no,n.no_of_pages , s.st_firstname+''+s.st_lastname as fullname from brilliantStudentNotes n join STMTR s on n.StudentId=s.Reg_no join CRSMTR c on c.Course_no=n.Course_no where n.Course_no=${course_no} and note_id=${note_id}`;
    if (result.recordset.length > 0) {
      console.log(result.recordset[0]);
      res.json({
        success: true,
        message: "Note details fetched successfully",
        data: result.recordset[0],
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const CreateNotePrintRequest = async (req, res) => {
  const {
    student_id,
    emp_no,
    note_id,
    color_mode,
    print_sides,
    photocopier_id,
    copies,
    pickup_time,
    order_type,
  } = req.body; 

  
  try {
    const pool = await poolPromise;
      
    let teacher_note_id = null;
let student_note_id = null;

// check Notes table
const teacherCheck = await pool.request().query`
  SELECT note_id FROM Notes WHERE note_id = ${note_id}
`;

if (teacherCheck.recordset.length > 0) {
  teacher_note_id = note_id;

} else {
  const studentCheck = await pool.request().query`
    SELECT note_id FROM brilliantStudentNotes WHERE note_id = ${note_id}
  `;

  if (studentCheck.recordset.length > 0) {
    student_note_id = note_id;

  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid note_id",  
    });
  }
}




    if ((student_id && emp_no) || (!student_id && !emp_no)) {
      return res.status(400).json({
        success: false,
        message: "Send either reg_no or emp_no only",
      });
    }

    let user_type = student_id ? "student" : "teacher";
    let user_id = student_id ? student_id : emp_no;
    // INSERT ORDER
    const result = await pool.request().query(`
            INSERT INTO ORDERS (user_id, user_type, order_type, photocopier_id)
          VALUES ('${user_id}' ,'${user_type}', '${order_type}', '${photocopier_id}');

            SELECT SCOPE_IDENTITY() AS order_id
        `);

    const order_id = result.recordset[0].order_id;

    // INSERT DETAILS
    await pool.request().query(`
  INSERT INTO Note_Print_detail
  (order_id, teacher_note_id, student_note_id, color_mode, print_sides, copies, pickup_time)
  VALUES
  ( ${order_id}, ${teacher_note_id}, ${student_note_id}, '${color_mode}', '${print_sides}', ${copies}, '${pickup_time}'  )
`);


    return res.json({
      success: true,
      message: "Note print request created successfully",
      order_id,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const personalnoteprintorder = async (req,res) => {
  const {
    title,
    order_type,
    Reg_no,
    copies,
    no_of_pages,
    color_mode,
    print_sides,
    pickup_time,
  } = req.body;
 
console.log
  if (!title || !order_type || !Reg_no || !copies || !no_of_pages || !color_mode || !print_sides || !pickup_time) {
  return res.status(400).json({
    success: false,
    message: "Missing required fields",
  });
}
   if (!req.file || !req.file.filename) {
  return res.status(400).json({
    success: false,
    message: "PDF file is required",
  });
}
try {
    let user_type = 'student';
const no_of_pages_num = parseInt(no_of_pages, 10);
const copies_num = parseInt(copies, 10);
    const filePath = `/uploads/${req.file.filename}`;
    const pool = await poolPromise;
    const result = await pool.request().query(` 
      INSERT INTO PersonalNotes (user_id, title, no_of_pages, file_path)

      VALUES ('${Reg_no}', '${title}',  ${no_of_pages_num}, '${filePath}')
        SELECT SCOPE_IDENTITY() AS personal_note_id;
    `);
    const personalNoteId = result.recordset[0].personal_note_id;

    const order = await pool.request().query(`
      insert into ORDERS  (user_id, user_type, order_type)
      values ('${Reg_no}', '${user_type}', '${order_type}');

        SELECT SCOPE_IDENTITY() AS order_id
      `);
   const order_id = order.recordset[0].order_id;
    await pool.request().query(`
      INSERT INTO Note_Print_detail (order_id, personal_note_id, copies, color_mode, print_sides, pickup_time)

      values ('${order_id}', '${personalNoteId}', '${copies_num}', '${color_mode}', '${print_sides}', '${pickup_time}')
`);

    return res.json({
      success: true,
      message: "Note print request created successfully",
      order_id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  NotesPrintRequest,
  CreateNotePrintRequest,
  personalnoteprintorder,
  files,
};
