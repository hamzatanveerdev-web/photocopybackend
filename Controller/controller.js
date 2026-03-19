

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
    const { courseNo, section, DISCIPLINE, sem_no } = req.body;
    
   
    if (!courseNo || !section || !DISCIPLINE || !sem_no) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields' 
        });
    }
    
    try {
        await sql.connect(config);
        
        const result = await sql.query`
            SELECT DISTINCT
                a.COURSE_NO,
                e.Emp_no,
                e.Emp_firstname + ' ' + e.Emp_lastname AS Teacher_Name
            FROM ALLOCATE a
            JOIN EMPMTR e ON e.Emp_no = a.Emp_no
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




module.exports = { Login, EnrollerdCourses,TeacherCoursesnotes };