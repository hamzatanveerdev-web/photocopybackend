
const { poolPromise } = require("../db");


const loginadmin=async (req,res)=>{
  console.log("Admin login request received");
    const {name ,password}=req.body;
    if(!name || !password){
        return res.status(400).json({success:false,message:"Name and password are required"});
    }
    try{
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM Admin WHERE name='${name}' AND password='${password}'`);   
        if(result.recordset.length > 0){
            res.status(200).json({success:true,message:"Login successful",data:result.recordset});
        }else{
            res.status(400).json({success:false,message:"Invalid credentials"});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({error:err.message});
        
    }
}

const getParents = async (req, res) => {

	try {
		const pool = await poolPromise;
		const result = await pool.request().query(`
			SELECT p.parent_id, p.name, p.email, p.phone, p.created_at,
				ps.parent_student_id, ps.child_id, ps.relationship
			FROM Parent p
			LEFT JOIN ParentStudent ps ON ps.parent_id = p.parent_id
			ORDER BY p.parent_id DESC
		`);

		return res.status(200).json({
			success: true,
			data: result.recordset,
		});
	} catch (err) {
		console.error('Get parents error:', err);
		return res.status(500).json({
			success: false,
			message: 'Failed to fetch parents',
			error: err.message,
		});
	}
};
const deleteParent = async (req, res) => {
  const { id } = req.params;

  console.log("Backend received parent ID:", id);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "A valid parent id is required",
    });
  }

  try {
    const pool = await poolPromise;

    // First delete relation
    await pool
      .request()
      .query(`
        DELETE FROM ParentStudent
        WHERE parent_id = '${id}'
      `);

    // Then delete parent
    const parentResult = await pool
      .request()
      .query(`
        DELETE FROM Parent
        WHERE parent_id = '${id}'
      `);

    if (parentResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Parent deleted successfully",
    });

  } catch (err) {
    console.error("Delete parent error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete parent",
      error: err.message,
    });
  }
};
const addParent = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    child_id,
  } = req.body;

  // Required fields
  if (!name || !email || !password || !child_id) {
    return res.status(400).json({
      success: false,
      message: "name, email, password and child_id are required",
    });
  }

  try {
    const pool = await poolPromise;

    // -----------------------------------
    // 1. Check child exists
    // -----------------------------------
    const studentResult = await pool
      .request()
     
      .query(`
        SELECT TOP 1 Reg_no, sex
        FROM STMTR
        WHERE Reg_no = '${child_id}'
      `);

    if (studentResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Child does not exist",
      });
    }

    // -----------------------------------
    // 2. Get student's gender
    // -----------------------------------
    const gender = studentResult.recordset[0].sex;

    let chgender = "Child";

    if (gender && gender.toLowerCase() === "m") {
      chgender = "Son";
    } else if (gender && gender.toLowerCase() === "f") {
      chgender = "Daughter";
    }

    console.log("Child gender:", gender);
    console.log("Child relationship:", chgender);

    // -----------------------------------
    // 3. Insert Parent
    // -----------------------------------
    const parentResult = await pool
      .request()
      .query(`
        INSERT INTO Parent
          (name, email, password, phone)

        OUTPUT
          INSERTED.parent_id,
          INSERTED.name,
          INSERTED.email,
          INSERTED.phone,
          INSERTED.created_at

        VALUES
          ('${name}', '${email}', '${password}', '${phone}')
      `);

    // -----------------------------------
    // 4. Get newly created parent ID
    // -----------------------------------
    const parentId = parentResult.recordset[0].parent_id;

    console.log("New Parent ID:", parentId);

    // -----------------------------------
    // 5. Insert ParentStudent relation
    // -----------------------------------
    await pool
      .request()
      .query(`
        INSERT INTO ParentStudent
          (parent_id, child_id, relationship)

        VALUES
          ('${parentId}', '${child_id}', '${chgender}')
      `);

    // -----------------------------------
    // 6. Success response
    // -----------------------------------
    return res.status(201).json({
      success: true,
      message: "Parent added successfully",
      data: parentResult.recordset[0],
    });

  } catch (err) {
    console.error("Add parent error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to add parent",
      error: err.message,
    });
  }
};
module.exports = { loginadmin , addParent, getParents, deleteParent };
      