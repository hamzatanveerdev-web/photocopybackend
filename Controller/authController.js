const { poolPromise } = require("../db");
//const nodemailer = require("nodemailer");
// const { randomInt } = require("crypto");

// const createMailTransporter = () => {
//   const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
//   if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
//     throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured");
//   }

//   return nodemailer.createTransport({
//     host: SMTP_HOST,
//     port: Number(SMTP_PORT),
//     secure: process.env.SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
//     auth: { user: SMTP_USER, pass: SMTP_PASS },
//   }); 
// };

// const hashOtp = (otp) => createHash("sha256").update(otp).digest();

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
      .request().query(
        `SELECT Emp_no, Emp_firstname+' '+Emp_lastname as fullname FROM EMPMTR WHERE Emp_no = ${password}`,
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
      message: "Name and password missing",
    });
  }

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "name is missing",
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
      .request().query(`
        SELECT id, photocopier_name, shop_name, email
        FROM Photocopier
        WHERE photocopier_name = '${name}' AND password = ${password}
      `); 
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
 const {username, regno} = req.body;
 console.log(username, regno);
  if (!username && !regno) {
    return res.status(400).json({
      success: false,
      message: "Name and Arid number missing ",
    });
s(400).json({
      success: false,
      message: "Name and Arid number missing ",
    }); 
  }

  if (!regno) {
    return res.status(400).json({
      success: false,
      message: " Arid number is missing ",
    });
  }

  try {
    console.log(username, regno);
    const pool = await poolPromise;

    const result = await pool
      .request().query(
        `SELECT Reg_no,Semester_no, St_firstname+' '+St_lastname as fullname FROM STMTR WHERE REG_NO = '${regno}' `,
      );
    if (esult.reordset.length > 0) {
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

async function registerShopkeeper(req, res) {
  const { photocopier_name, shop_name, email, password ,phone,address } = req.body;
  
  if (!photocopier_name || !shop_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }
  
  try {
    const pool = await poolPromise;
    const existingShopkeeper = await pool
      .request().query(`
        SELECT * FROM Photocopier WHERE email = '${email}'
      `);
    
    if (existingShopkeeper.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }
    
   // const otp = randomInt(100000, 999999).toString();
    //save temparary into db CREATE TABLE ShopkeeperOTP (
//     id INT IDENTITY(1,1) PRIMARY KEY,
//     email VARCHAR(150) NOT NULL,
//     otp VARCHAR(6) NOT NULL,
//     expires_at DATETIME NOT NULL,
//     created_at DATETIME DEFAULT GETDATE()
// );
    
    // const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    // await pool.request().query(`
    //   INSERT INTO ShopkeeperOTP (email, otp, expires_at)
    //   VALUES ('${email}', '${otp}', '${expiresAt.toISOString()}')
    // `);
    
    // const transporter = createMailTransporter();
    // await transporter.sendMail({
    //   from: process.env.SMTP_USER,
    //   to: email,
    //   subject: "Your OTP for Shopkeeper Registration",
    //   text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    // });

      // res.status(200).json({
    //   success: true,
    //   message: "OTP sent successfully",
    // });

    const savedata=pool.request().query(`
      INSERT INTO Photocopier (photocopier_name, shop_name, email, password ,phone ,address)
      VALUES ('${photocopier_name}', '${shop_name}', '${email}', '${password}', '${phone}', '${address}')
    `);
      res.status(200).json({
        success: true,
        message: "Shopkeeper registered successfully", 
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
} 
// async function verifyShopkeeperOtp(req, res) {
//   const { email, otp, photocopier_name, shop_name, password  } = req.body;
//     if (!email || !otp || !photocopier_name || !shop_name || !password) {
//     return res.status(400).json({
//       success: false,
//       message: "All fields are required",

//     }); 
//   }
//   try {
//     const pool = await poolPromise;
//     const result = await pool.request().query(`
//       SELECT * FROM ShopkeeperOTP WHERE email = '${email}' AND otp = '${otp}'
//     `);
      
//     if (result.recordset.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }
    
//     const otpRecord = result.recordset[0];
//     const now = new Date();
//     if (now > new Date(otpRecord.expires_at)) {
//       return res.status(400).json({
//         success: false,
//         message: "OTP has expired",
//       });
//     }
    
//     await pool.request().query(`
//       INSERT INTO Photocopier (photocopier_name, shop_name, email, password)
//       VALUES ('${photocopier_name}', '${shop_name}', '${email}', '${password}')
//     `);
      
//     await pool.request().query(`
//       DELETE FROM ShopkeeperOTP WHERE email = '${email}'
//     `);
    
//     res.status(200).json({
//       success: true,
//       message: "Shopkeeper registered successfully",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// }



module.exports = {
  teacherlogin,
  ShopkeeperLogin,
  Login,
  registerShopkeeper,
  //verifyShopkeeperOtp,
};
