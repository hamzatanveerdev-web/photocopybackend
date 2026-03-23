

const sql = require('mssql/msnodesqlv8');
const config = require('../sqlconnection');
// student login function
async function Login(req, res) {
   const username = req.query.name;
   const regno = req.query.reg_no;

    try {
        console.log(username, regno);
        await sql.connect(config);
        const result = await sql.query(`SELECT Reg_no,Semester_no FROM STMTR WHERE REG_NO='${regno}' AND St_firstname+' '+St_lastname='${username}'`);
        if (result.recordset.length > 0) {
            res.json({ success: true, message: 'Login successful', data: result.recordset });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }   
    } catch (err) {
        console.error(err);

        res.status(500).json({ error: err.message });

    } finally {
        await sql.close();
    }
} 
// student course data get function
async function EnrollerdCourses(req, res) {
   const regno = req.query.reg_no;
        try {
            console.log(regno); 
            await sql.connect(config);
        const result = await sql.query(`
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
                res.json({ success: true, message: 'Courses fetched successfully', data: result.recordset });
            } else {
                res.json({ success: false, message: 'No courses found for this student' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        } finally {
            await sql.close();
        }
}


// teacher course data get function
async function TeacherCoursesnotes(req, res) {
    const courseNo = req.query.Course_no;
     const section= req.query.SECTION;
      const  DISCIPLINE = req.query.DISCIPLINE;
       const  sem_no  = req.query.Semester_no;
       console.log(courseNo, section, DISCIPLINE, sem_no);


    
   
    if (!courseNo || !section || !DISCIPLINE || !sem_no) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }
    
    try {
        await sql.connect(config);
        
        const result = await sql.query`
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
            message: 'Courses fetched successfully', 
            data: result.recordset 
        });
        
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    } finally {
        try {
            await sql.close();
        } catch (closeErr) {
            console.error('Error closing connection:', closeErr);
        }
    }
}


// stationery product data get function 
const Stationery = async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM Stationery`;
        res.json({ success: true, message: 'Products fetched successfully', data: result.recordset });
    }
    catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
      
            await sql.close();
           }
};

// student wallet data get function
const Wallet = async (req, res) => {
    const regno = req.query.reg_no;
    try {
        console.log(regno);
        await sql.connect(config);
        const result = await sql.query`select balance from Wallet where user_ref_id=${regno}`;
        if (result.recordset.length > 0) {
            res.json({ success: true, message: 'Wallet balance fetched successfully', data: result.recordset[0].balance });
        } else {
            res.json({ success: false, message: 'No wallet information found for this student' });
        }
    }
    catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        await sql.close();
    }
};

//notesprint request function first data get of notes then user fill print data i make this to get notes data 

const NotesPrintRequest = async (req, res) => {
    const course_no = req.query.course_no;
    const note_id = req.query.note_id;
    try {
        console.log(course_no, note_id);
        await sql.connect(config);
        const result = await sql.query`select distinct n.title ,c.Course_desc, n.week_no,n.no_of_pages , e.Emp_firstname+''+e.Emp_lastname as Emp_fullname from Notes n join EMPMTR e on n.Emps_no=e.Emp_no join CRSMTR c on c.Course_no=n.Course_no where n.Course_no=${course_no} and note_id=${note_id}`;
        if (result.recordset.length > 0) {
            console.log(result.recordset[0]);
            res.json({ success: true, message: 'Note details fetched successfully', data: result.recordset[0] });
        } else {    
            res.json({ success: false, message: 'No note information found for this course and note ID' });
        }
    }
    catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        await sql.close();
    }
};




module.exports = { Login, EnrollerdCourses,TeacherCoursesnotes, Stationery,Wallet ,NotesPrintRequest};