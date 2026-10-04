const { sql, poolPromise } = require('../db');


const loginparent=async(req,res)=>{
	const { name, password } = req.body;

	if (!name || !password) {
		return res.status(400).json({
			success: false,
			message: 'name and password are required',
		});
	}

	try {
		const pool = await poolPromise;
		const result = await pool
			.request()
			.input('name', sql.VarChar(100), name)
			.input('password', sql.VarChar(255), password)
			.query('SELECT name ,parent_id FROM Parent WHERE name = @name AND password = @password');

		if (result.recordset.length === 0) {
			return res.status(401).json({
				success: false,
				message: 'Invalid name or password',
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Login successful',
			data: result.recordset[0],
		});
	} catch (err) {
		console.error('Login parent error:', err);
		return res.status(500).json({
			success: false,
			message: 'Failed to login parent',
			error: err.message,
		});
	}

}

const getEnrolledChildren=async(req,res)=>{
const parent_id=req.query.parent_id;	
console.log(parent_id)
    try{                                                                                                    
          if(!parent_id){                      
            return res.status(403).json({
                success:false,
                message:'only parent can access'
            }) 
          }                                                               
          const pool = await poolPromise;
		  const result = await pool.request()
		  			.input('parent_id', sql.Int, parent_id)
							  			.query(` select s.Reg_No as child_id,s.St_firstname + ' ' + s.St_lastname as fullName,s.Final_Course as department,
        ps.relationship as relationship,a.SEMESTER_NO as semester,a.SECTION as section,a.CGPA as cgpa,
        w.balance as balance from ParentStudent ps INNER JOIN STMTR s on ps.child_id = s.Reg_No
       LEFT JOIN Accgpa a on a.REG_NO = s.Reg_No
       AND a.SemC = (
        SELECT MAX(SemC)
        from Accgpa
        where REG_NO = s.Reg_No
    )

    LEFT JOIN Wallet w on w.user_ref_id = s.Reg_No AND w.user_type = 'student'

    where ps.parent_id = ${parent_id}
`);			
                                                              
          return res.status(200).json({
            success:true,
            message:'Enrolled child fetched successfully',
            data:result.recordset
          })                                           
    }catch(err){
        console.log(err.message);
        return res.status(500).json({
            success:false,
            message:'server error!'
        })
    }                   
}
const addWalletAmount=async(req,res)=>{
    try{
         if(!req.body.parent_id){
            return res.status(403).json({
                success:false,
                message:'only parent can access'
            })
         }
         const parentId=req.body.parent_id;
         const{child_id,amount}=req.body;
         if(!child_id||!amount||amount<=0){
            return res.status(400).json({
                success:false,
                message:'childid and valid amount is required'
            })
         }
		 const pool = await poolPromise;
		 
         const checkresult=await pool.request()
		 			.input('parent_id', sql.Int, parentId)
		 			.input('child_id', sql.VarChar(50), child_id)
							  			.query(`select * from ParentStudent where parent_id=@parent_id AND child_id=@child_id `)

         if(checkresult.recordset.length===0){
            return res.status(403).json({
                success:false,
                message:'this student is not your child'
            })
         }
               //check wallet record exsists or not
         const walletcheck=await pool.request()
		 			.input('child_id', sql.VarChar(50), child_id)
							  			.query(`select * from wallet where user_ref_id=@child_id
         AND user_type='student'`)
         
         if(walletcheck.recordset.length>0){
            await pool.request()
            	.input('child_id', sql.VarChar(50), child_id)
            	.input('amount', sql.Decimal(10, 2), amount)
            	.query`update wallet set balance=balance+@amount,updated_at=GETDATE()
            where user_ref_id=@child_id AND user_type='student'`
         }
         else{
                //OTHERWISE CREATE NEW WALLET
            await pool.request()
            	.input('child_id', sql.VarChar(50), child_id)
            	.input('amount', sql.Decimal(10, 2), amount)
            	.query`insert into wallet(user_type,user_ref_id,balance,updated_at)
            values('student',@child_id,@amount,GETDATE())`
         }
                  //MAKE RECORD IN TRANSACTIONS
         await pool.request()
         	.input('child_id', sql.VarChar(50), child_id)
         	.input('amount', sql.Decimal(10, 2), amount)
         	.query`INSERT INTO Transactions(user_ref_id,user_type,amount,transaction_type,description,created_at)
         values(@child_id,'student',@amount,'credit','wallet amount added by parent',GETDATE())`

         return res.status(200).json({
            success:true,
            message:'wallet balance added successfully'
         })
    }catch(err){
        console.log(err.message);
        return res.status(500).json({
            success:false,
            message:'server error!'
        })
    }
}
const getRecentTransactions = async (req, res) => {
    try {

        const parent_id = req.query.parent_id;

        if (!parent_id) {
            return res.status(403).json({
                success: false,
                message: "Parent not identified"
            });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('parent_id', sql.Int, parent_id)
            .query(` SELECT TOP 10

    o.order_id,
    o.user_id,
    o.user_type,
    o.order_type,
    o.created_at,

    t.amount,

    npd.copies,
    npd.color_mode,
    npd.print_sides,

    CASE
        WHEN npd.teacher_note_id IS NOT NULL
            THEN n.title + '-Week ' + CAST(n.week_no AS VARCHAR)

        WHEN npd.student_note_id IS NOT NULL
            THEN bsn.title + '-Week ' + CAST(bsn.week_no AS VARCHAR)

        WHEN npd.personal_note_id IS NOT NULL
            THEN pn.title

        ELSE 'Document'
    END AS title

FROM ORDERS o

INNER JOIN ParentStudent ps
    ON ps.child_id = o.user_id

LEFT JOIN Transactions t
    ON t.user_ref_id= o.user_id

LEFT JOIN Note_Print_detail npd
    ON npd.order_id = o.order_id

LEFT JOIN Notes n
    ON n.note_id = npd.teacher_note_id

LEFT JOIN brilliantStudentNotes bsn
    ON bsn.note_id = npd.student_note_id

LEFT JOIN PersonalNotes pn
    ON pn.personal_note_id = npd.personal_note_id

WHERE ps.parent_id = @parent_id	

ORDER BY o.created_at DESC`);


        return res.status(200).json({
            success: true,
            message: "Recent transactions fetched successfully",
            data: result.recordset
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
module.exports={
    getEnrolledChildren,addWalletAmount,getRecentTransactions,loginparent
}

