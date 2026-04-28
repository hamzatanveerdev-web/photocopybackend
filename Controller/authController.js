const { poolPromise } = require("../db");

//login teacher
const teacherlogin = async (req, res) => {
  const name = req.query.name;
  const password = req.query.password;

  if (!name && !password) {
    return res.status(400).json({
      success: false,
      message: "Name and Employee number missing ",
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is missing ",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: " Employee number is missing ",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT Emp_no, Emp_firstname+' '+Emp_lastname as fullname FROM EMPMTR WHERE Emp_firstname+' '+Emp_lastname='${name}' AND Emp_no='${password}'`,
      );
    if (result.recordset.length > 0) {
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result.recordset,
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// shopkeeper login
async function ShopkeeperLogin(req, res) {
  const name = req.query.name;
  const password = req.query.password;

  if (!name && !password) {
    return res.status(400).json({
      success: false,
      message: "Name and password missing ",
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Name is missing ",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: " password is missing ",
    });
  }
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query(
        `SELECT shopkeeper_id, name, email FROM Shopkeeper WHERE name='${name}' AND password='${password}'`,
      );
     
    if (result.recordset.length > 0) {
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result.recordset,
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// student login function
async function Login(req, res) {
  const username = req.query.name;
  const regno = req.query.reg_no;

  if (!username && !regno) {
    return res.status(400).json({
      success: true,
      message: "Name and Arid number missing ",
    }); 
  }

  if (!username) {
    return res.status(400).json({
      success: true,
      message: "Name is missing ",
    });
  }

  if (!regno) {
    return res.status(400).json({
      success: true,
      message: " Arid number is missing ",
    });
  }

  try {
    console.log(username, regno);
    const pool = await poolPromise;

    const result = await pool
      .request()
      .query(
        `SELECT Reg_no,Semester_no, St_firstname+' '+St_lastname as fullname  FROM STMTR WHERE REG_NO='${regno}' AND St_firstname+' '+St_lastname='${username}'`,
      );
    if (result.recordset.length > 0) {
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result.recordset[0],
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  teacherlogin,
  ShopkeeperLogin,
  Login,
};
