
const { poolPromise } = require('../db');

const sql = require('mssql/msnodesqlv8');
const config = require('../sqlconnection');
// student login function
async function Login(req, res) {
   const username = req.query.name;
   const regno = req.query.reg_no;

    try {
        console.log(username, regno);
      const pool = await poolPromise;

    const result = await pool.request().query(`SELECT Reg_no,Semester_no FROM STMTR WHERE REG_NO='${regno}' AND St_firstname+' '+St_lastname='${username}'`);
        if (result.recordset.length > 0) {
            res.json({ success: true, message: 'Login successful', data: result.recordset });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }   
    } catch (err) {
        console.error(err);

        res.status(500).json({ error: err.message });

    } 
} 
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
                res.json({ success: true, message: 'Courses fetched successfully', data: result.recordset });
            } else {
                res.json({ success: false, message: 'No courses found for this student' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
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
            message: 'Courses fetched successfully', 
            data: result.recordset 
        });
        
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    } 
}


// stationery product data get function 
const Stationery = async (req, res) => {
    try {
         const pool = await poolPromise;

    const result = await pool.request().query`SELECT * FROM Stationery`;
        res.json({ success: true, message: 'Products fetched successfully', data: result.recordset });
    }
    catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: err.message });
    } 
};

// student wallet data get function
const Wallet = async (req, res) => {
    const regno = req.query.Reg_no;
    try {
        console.log(regno);
         const pool = await poolPromise;

    const result = await pool.request().query`select balance from wallet where user_ref_id=${regno}`;
        if (result.recordset.length > 0) {
            res.json({ success: true, message: 'wallet balance fetched successfully', data: result.recordset[0].balance });
        } else {
            res.json({ success: false, message: 'No wallet information found for this student' });
        }
    }
    catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, error: err.message });
    } 
};



const NotesPrintRequest = async (req, res) => {
    const course_no = req.query.course_no;
    const note_id = req.query.note_id;
    try {
        console.log(course_no, note_id);
        const pool = await poolPromise;

    const result = await pool.request().query`select distinct n.note_id, n.title ,c.Course_desc, n.week_no,n.no_of_pages , e.Emp_firstname+''+e.Emp_lastname as Emp_fullname from Notes n join EMPMTR e on n.Emps_no=e.Emp_no join CRSMTR c on c.Course_no=n.Course_no where n.Course_no=${course_no} and note_id=${note_id}`;
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
    } 
};


const CreateNotePrintRequest = async (req, res) => {
    const {
        student_id,
        emp_no,
        note_id,
        color_mode,
        print_sides,
        copies,
        pickup_time
    } = req.body;

    try {
        const pool = await poolPromise;
    
        if ((student_id && emp_no) || (!student_id && !emp_no)) {
            return res.status(400).json({
                success: false,
                message: "Send either student_id or emp_no only"
            });
        }

        let user_type = student_id ? "student" : "teacher";

        // INSERT ORDER
        const result = await pool.request().query(`
            INSERT INTO ORDERS (reg_no, emp_no, user_type, order_type)
          VALUES (${student_id ? `'${student_id}'` : null}, ${emp_no ? `'${emp_no}'` : null}, '${user_type}', 'note_print')

            SELECT SCOPE_IDENTITY() AS order_id;
        `);

        const order_id = result.recordset[0].order_id;

        // INSERT DETAILS
        await pool.request().query(`
            INSERT INTO Note_Print_detail
            (order_id, note_id, color_mode, print_sides, copies, pickup_time)
            VALUES
            (${order_id}, ${note_id}, '${color_mode}', '${print_sides}', ${copies}, '${pickup_time}');
        `);

        return res.json({
            success: true,
            message: "Note print request created successfully",
            order_id
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};



const updatewalletamount = async (req, res) => {
    const { Reg_no, emp_id, amount } = req.body;
    const shopkeeper_id = 1;

    let user_id;
    let user_type = Reg_no ? "student" : "teacher";

    if (Reg_no) {
        user_id = Reg_no;
    } else if (emp_id) {
        user_id = emp_id;
    } else {
        return res.status(400).json({
            success: false,
            message: "User ID required"
        });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);

        await transaction.begin();

        try {
           console.log('user_id',user_id);
            const balanceResult = await new sql.Request(transaction).query(`
                SELECT balance FROM wallet WHERE user_ref_id='${user_id}'
            `);

            const balance = balanceResult.recordset[0]?.balance;

            if (balance === undefined) {
                throw new Error("User wallet not found");
            }

            if (balance < amount) {
                throw new Error("Insufficient balance");
            }

          
            await new sql.Request(transaction).query(`
                UPDATE wallet
                SET balance = balance - ${amount}
                WHERE user_ref_id = '${user_id}'
            `);

          
            await new sql.Request(transaction).query(`
                INSERT INTO TRANSACTIONS (user_ref_id, amount, transaction_type, description)
                VALUES ('${user_id}', ${amount}, 'debit', 'Print notes')
            `);

         
            await new sql.Request(transaction).query(`
                UPDATE wallet
                SET balance = balance + ${amount}
                WHERE user_ref_id = '${shopkeeper_id}'
            `);

          
            await new sql.Request(transaction).query(`
                INSERT INTO TRANSACTIONS (user_ref_id, amount, transaction_type, description)
                VALUES ('${shopkeeper_id}', ${amount}, 'credit', 'Payment received')
            `);

            await transaction.commit();

            return res.json({
                success: true,
                message: "Transaction completed successfully"
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

const orderstatus = async (req, res) => {
    const user_id = req.query.user_id;
    const user_type= req.query.user_type;


    try {
        const pool = await poolPromise;

      

        // 👨‍🎓 Student
        if (user_type === 'student') {
        
             const result = await pool.request().query(`
                SELECT COUNT(*) AS total_orders 
                FROM ORDERS 
                WHERE Reg_no ='${user_id}'
            `);
              res.json({
            success: true,
            message: "Order status fetched successfully",
            data: result.recordset[0]
        });
        }
      
        else if (user_type === 'teacher') {
          
             const result = await pool.request().query(`
                SELECT COUNT(*) AS total_orders 
                FROM ORDERS 
                WHERE emp_id = '${user_id}'
            `);
              res.json({
            success: true,
            message: "Order status fetched successfully",
            data: result.recordset[0]
        });
        }
        else {
            return res.status(400).json({
                success: false,
                message: "Please send reg_no or emp_id"
            });
        }

       

      

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};


module.exports = { Login, EnrollerdCourses,TeacherCoursesnotes, Stationery,Wallet ,NotesPrintRequest,CreateNotePrintRequest,updatewalletamount,orderstatus};