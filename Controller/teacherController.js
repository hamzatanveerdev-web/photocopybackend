const { poolPromise } = require("../db");
const multer = require("multer");
const fs = require("fs");

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
          SELECT DISTINCT a.COURSE_NO,n.week_no,n.no_of_pages,n.title,n.note_id,e.Emp_no,
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

    res.json({
      success: true,
      message: "Courses fetched successfully",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

//teacher enroll course show
const teacherenrollcourse = async (req, res) => {
  const user_id = req.query.user_id;
  console.log(user_id);
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT DISTINCT
    e.Emp_no,
    e.Emp_firstname + ' ' + e.Emp_lastname AS fullname,
    a.COURSE_NO,
    c.Course_desc,
    a.SEMESTER_NO
FROM EMPMTR e 
JOIN ALLOCATE a ON e.Emp_no = a.EMP_NO 
JOIN CRSMTR c ON c.course_no = a.COURSE_NO

WHERE e.Emp_no = '${user_id}'
AND a.semester_no = (
    SELECT MAX(semester_no) 
    FROM ALLOCATE 
    WHERE EMP_NO = '${user_id}'
)`);

    return res.status(200).json({
      success: true,
      message: "Enrolled Courses fetched successfully",
      data: result.recordset,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// view course notes
const courseNotes = async (req, res) => {
  const { Course_no } = req.params;
  console.log(Course_no);
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `select note_id ,title ,Course_no,week_no,no_of_pages,created_at  from Notes where Course_no='${Course_no}'`,
      );

    return res.status(200).json({
      success: true,
      message: "Enrolled Courses fetched successfully",
      data: result.recordset,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const filesstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("files")) {
      fs.mkdirSync("files");
    }
    cb(null, "files/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const files = multer({ storage: filesstorage });

const uploadCourseNotes = async (req, res) => {
  const { title, Emp_no, Course_no, week_no, no_of_pages, notify_students } =
    req.body;


  if (!title || !Emp_no || !Course_no || !week_no || !no_of_pages) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  if (!req.file.filename) {
    return res.status(400).json({
      success: false,
      message: "PDF file is required",
    });
  }

  try {
    const pool = await poolPromise;



    const result = await pool.request().query(`
        SELECT SOS, DISCIPLINE FROM ALLOCATE a
        WHERE Course_no= '${Course_no}' and Emp_no= '${Emp_no}'   AND a.SEMESTER_NO = (SELECT MAX(SEMESTER_NO) FROM ALLOCATE WHERE EMP_NO = '${Emp_no}' AND COURSE_NO = '${Course_no}')
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course not found or not assigned to this teacher",
      });
    }

    const SOS = result.recordset[0].SOS;
    const DISCIPLINE = result.recordset[0].DISCIPLINE;

    let status = "";
    if (Emp_no) {
      status = "approved";
    } else {
      status = "pending";
    }

    const filePath = `/uploads/${req.file.filename}`;

    await pool.request().query(`
        INSERT INTO Notes (title, Emps_no, Course_no, week_no, no_of_pages, status, SOS, DISCIPLINE, file_url)
        VALUES ('${title}', '${Emp_no}', '${Course_no}', '${week_no}', '${no_of_pages}', '${status}', '${SOS}', '${DISCIPLINE}', '${filePath}')
      `);

    if (notify_students) {
      const studentsResult = await pool.request().query(`
       SELECT distinct c.REG_NO FROM Crsdtl c JOIN ALLOCATE a   ON a.COURSE_NO = c.Course_no 
  AND a.SEMESTER_NO = c.SEMESTER_NO WHERE   a.EMP_NO = '${Emp_no}'   AND a.COURSE_NO = '${Course_no}' 
  AND a.SEMESTER_NO = (SELECT MAX(SEMESTER_NO) FROM ALLOCATE WHERE EMP_NO = '${Emp_no}' AND COURSE_NO = '${Course_no}')
   `);
      let message = `New notes uploaded for Course ${title} ${Course_no} by your teacher.`;
      const students = studentsResult.recordset;
      for (const student of students) {
        await pool.request().query(`
            INSERT INTO Notifications (sender_id, receiver_id, message, user_type)
            VALUES ('${Emp_no}', '${student.REG_NO}', '${message}', 'teacher');
          `);
      }
    }
    return res.status(200).json({
      success: true,
      message: "Notes uploaded successfully",
    });
  } catch (err) {
    console.error("Error uploading notes:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const viewenrollcoursestudent = async (req, res) => {
  const Emp_no = req.query.emp_no;
  const course_no = req.query.course_no;

  if (!Emp_no || !course_no) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`

SELECT distinct
 s.St_firstname + ' ' + s.St_lastname AS StudentFullName,
    c.Course_no,
    c.SECTION,
    c.SEMESTER_NO,
    c.DISCIPLINE,
	ag.CGPA,
	a.SemC,
    c.REG_NO,

    case when BrilliantId is not null then 1 else 0 end as isBrilliant
FROM ALLOCATE a
INNER JOIN Crsdtl c 
    ON a.COURSE_NO = c.Course_no
    AND a.SEMESTER_NO = c.SEMESTER_NO
    AND a.SECTION = c.SECTION
    AND a.DISCIPLINE = c.DISCIPLINE
    AND a.SOS = c.SOS
	INNER JOIN Accgpa ag on ag.REG_NO=c.REG_NO 
	AND ag.SemC = (SELECT MAX(SemC) FROM Accgpa where REG_NO = c.REG_NO and CGPA>3.2)
 

  left JOIN BrilliantStudents bs
    ON bs.StudentId = c.REG_NO
    AND bs.TeacherId = '${Emp_no}'
    AND bs.CourseId = c.Course_no

  INNER JOIN STMTR s 
    ON s.Reg_No = c.REG_NO
WHERE a.EMP_NO = '${Emp_no}'
  AND a.COURSE_NO = '${course_no}'
   AND a.SEMESTER_NO = (
    SELECT TOP 1 SEMESTER_NO
    FROM ALLOCATE
    WHERE EMP_NO = '${Emp_no}'
      AND COURSE_NO = '${course_no}'
    ORDER BY SEMESTER_NO DESC
)

  order by c.DISCIPLINE ,c.SECTION

`);





    return res.status(200).json({
      success: true,
      message: "Enrolled Courses fetched successfully",
      data: result.recordset
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const markbrilliant = async (req, res) => {
  const { reg_no, stdname, course_no, semester_no, emp_no, emp_name } = req.body;
  console.log(course_no)
  if (!course_no || !reg_no || !stdname || !semester_no || !emp_no || !emp_name) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
            INSERT INTO BrilliantStudents (CourseId, StudentId, StudentName, TeacherName, Semester_No, TeacherId)
            VALUES ('${course_no}', '${reg_no}', '${stdname}', '${emp_name}', '${semester_no}', '${emp_no}')
        `);
    const message = `Mr. ${emp_name} allow to Upload personal notes to help your classmates for course ${course_no} `
    await pool.request().query(`
            INSERT INTO Notifications (sender_id, receiver_id, message, user_type)
            VALUES ('${emp_no}', '${reg_no}', '${message}', 'teacher');
          `);
    return res.status(200).json({
      success: true,
      message: "Brilliant marked successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

const getBrilliantStudentNotesRequest = async (req, res) => {
  const emp_no = req.query.emp_no;

  if (!emp_no) {
    return res.status(400).json({
      success: false,
      message: "Employee number required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT distinct bsn.*, s.St_firstname + ' ' + s.St_lastname AS StudentName, c.Course_desc
      FROM brilliantStudentNotes bsn
      LEFT JOIN STMTR s ON s.Reg_No = bsn.StudentId
      LEFT JOIN CRSMTR c ON c.course_no = bsn.CourseId
      WHERE bsn.TeacherId = '${emp_no}'
     and bsn.Status='Pending'
      ORDER BY bsn.CreatedAt DESC
    `);

    return res.json({
      success: true,
      message: "Brilliant student notes requests fetched successfully",
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

//approve student notes 
const approveStudentNotes = async (req, res) => {
  const { id } = req.body;
  console.log(id)
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Note ID required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      UPDATE brilliantStudentNotes 
      SET Status = 'Approved'
      WHERE Id = '${id}'
    `);

    const notifystudent = await pool.request().query(`
     select notify_std ,StudentId ,CourseId ,TeacherId ,Title from brilliantStudentNotes where Id = '${id}'
    `);
     const Emp_no = notifystudent.recordset[0].TeacherId;
      const Course_no = notifystudent.recordset[0].CourseId;
      const StudentId = notifystudent.recordset[0].StudentId;
      const Title = notifystudent.recordset[0].Title;
 let msg = `${Title} note for Course ${Course_no} has been approved by ${Emp_no}`;

await pool.request().query(`
  INSERT INTO Notifications (sender_id, receiver_id, message, user_type)
  VALUES ('${Emp_no}', '${StudentId}', '${msg}', 'teacher')
`);
  if (notifystudent.recordset.length > 0 && Number(notifystudent.recordset[0].notify_std) === 1) {
     
      const studentsResult = await pool.request().query(`
       SELECT distinct c.REG_NO FROM Crsdtl c JOIN ALLOCATE a   ON a.COURSE_NO = c.Course_no 
  AND a.SEMESTER_NO = c.SEMESTER_NO WHERE   a.EMP_NO = '${Emp_no}'   AND a.COURSE_NO = '${Course_no}' 
  AND a.SEMESTER_NO = (SELECT MAX(SEMESTER_NO) FROM ALLOCATE WHERE EMP_NO = '${Emp_no}' AND COURSE_NO = '${Course_no}')
   `);
      let message = `New ${Title} note uploaded for Course  ${Course_no} by  ${StudentId}.`;

      let msg = `Your ${Title} note for Course  ${Course_no} has been approved. by ${Emp_no}`;
      const students = studentsResult.recordset;

      for (const student of students) {
        if (student.REG_NO !== StudentId) {

          await pool.request().query(`
            INSERT INTO Notifications (sender_id, receiver_id, message, user_type)
            VALUES ('${Emp_no}', '${student.REG_NO}', '${message}', 'student');
          `);
        }

      }
    }

    return res.status(200).json({
      success: true,
      message: "Student notes approved successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

//reject notes
const rejectStudentNotes = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Note ID required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      UPDATE brilliantStudentNotes 
      SET Status = 'Rejected'
      WHERE Id = '${id}'
    `);

    return res.status(200).json({
      success: true,
      message: "Student notes rejected successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  TeacherCoursesnotes,
  teacherenrollcourse,
  courseNotes,
  files,
  uploadCourseNotes,
  viewenrollcoursestudent,
  markbrilliant,
  getBrilliantStudentNotesRequest,
  approveStudentNotes,
  rejectStudentNotes,
};
