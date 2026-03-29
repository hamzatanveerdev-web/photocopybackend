const { poolPromise } = require("../db");
const multer = require("multer");
const fs = require("fs");

const sql = require("mssql/msnodesqlv8");
const config = require("../sqlconnection");

//login teacher
const teacherlogin=async(req,res)=>{
   const name = req.query.name;
  const password = req.query.password;

  if(!name && !password){
    return res.status(400).json({
        success: false,
        message: "Name and Employee number missing ",
 
      });

  }

  
 if (!name  ) {
     return res.status(400).json({
        success: false,
        message: "Name is missing ",

      });
    } 


 if ( !password ) {
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
}

// shopkeeper login
async function ShopkeeperLogin(req, res) {
  const name = req.query.name;
  const password = req.query.password;

  
  if(!name && !password){
    return res.status(400).json({
        success: false,
        message: "Name and password missing ",

      });

  }

  
 if (!name  ) {
     return res.status(400).json({
        success: false,
        message: "Name is missing ",

      });
    } 


 if ( !password ) {
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


 if (!username && !regno ) {
     return res.status(400).json({
        success: true,
        message: "Name and Arid number missing ",

      });
    } 

 if (!username  ) {
     return res.status(400).json({
        success: true,
        message: "Name is missing ",

      });
    } 


 if ( !regno ) {
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

// stationery product data get function
const Stationery = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query`SELECT * FROM Stationery`;
    const products = result.recordset.map((item) => ({
      ...item,
      imagePath: `http://localhost:3000${item.product_img}`,
    }));

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// student wallet data get function
const Wallet = async (req, res) => {
  const regno = req.query.Reg_no;
  try {
    console.log(regno);
    const pool = await poolPromise;

    const result = await pool.request()
      .query`select balance from wallet where user_ref_id=${regno}`;
    if (result.recordset.length > 0) {
      res.json({
        success: true,
        message: "wallet balance fetched successfully",
        data: result.recordset[0].balance,
      });
    } else {
      res.json({
        success: false,
        message: "No wallet information found for this student",
      });
    }
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const NotesPrintRequest = async (req, res) => {
  const course_no = req.query.course_no;
  const note_id = req.query.note_id;
  try {
    console.log(course_no, note_id);
    const pool = await poolPromise;

    const result = await pool.request()
      .query`select distinct n.note_id, n.title ,c.Course_desc, n.week_no,n.no_of_pages , e.Emp_firstname+''+e.Emp_lastname as Emp_fullname from Notes n join EMPMTR e on n.Emps_no=e.Emp_no join CRSMTR c on c.Course_no=n.Course_no where n.Course_no=${course_no} and note_id=${note_id}`;
    if (result.recordset.length > 0) {
      console.log(result.recordset[0]);
      res.json({
        success: true,
        message: "Note details fetched successfully",
        data: result.recordset[0],
      });
    } else {
      res.json({
        success: false,
        message: "No note information found for this course and note ID",
      });
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
    copies,
    pickup_time,
    order_type,
  } = req.body;

  try {
    const pool = await poolPromise;

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
            INSERT INTO ORDERS (user_id, user_type, order_type)
          VALUES ('${user_id}' ,'${user_type}', '${order_type}');

            SELECT SCOPE_IDENTITY() AS order_id
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

const updatewalletamount = async (req, res) => {
  const { reg_no, emp_id, amount, description } = req.body;
  const shopkeeper_id = 1;

  let user_id;

  if (reg_no) {
    user_id = reg_no;
  } else if (emp_id) {
    user_id = emp_id;
  } else {
    return res.status(400).json({
      success: false,
      message: "User ID required",
    });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      console.log("user_id", user_id);
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
                VALUES ('${user_id}', ${amount}, 'debit', '${description}')
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
        message: "Transaction completed successfully",
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const ordercount = async (req, res) => {
  const user_id = req.query.user_id;

  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
                SELECT COUNT(*) AS total_orders 
                FROM ORDERS 
                WHERE user_id ='${user_id}'
                and status<>'completed'
            `);
    res.json({
      success: true,
      message: "Order status fetched successfully",
      data: result.recordset[0],
    });

   
    return res.status(400).json({
      success: false,
      message: "Please send user_id",
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
    const pool = await poolPromise;

    const result = await pool.request().query(`
          
              SELECT o.order_id,o.user_type ,o.status,o.order_type ,o.created_at ,n.title,np.copies  FROM ORDERS o join Note_Print_detail np on o.order_id=np.order_id join Notes n on np.note_id=n.note_id   where o.user_id='${user_id}' and o.status <> 'Completed'
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
  AND o.status <> 'Completed'
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

res.json({
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

const stationerybuyrequest = async (req, res) => {
  const { reg_no, emp_no, order_type, cartItems } = req.body;

  try {
    const pool = await poolPromise;

    if ((reg_no && emp_no) || (!reg_no && !emp_no)) {
      return res.status(400).json({
        success: false,
        message: "Send either reg_no or emp_no only",
      });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart items are required",
      });
    }

    const user_type = reg_no ? "student" : "teacher";
    const user_id = reg_no ? reg_no : emp_no;

    const orderResult = await pool
      .request()
      .input("user_id", sql.VarChar, user_id)
      .input("user_type", sql.VarChar, user_type)
      .input("order_type", sql.VarChar, order_type).query(`
                INSERT INTO ORDERS (user_id, user_type, order_type)
                VALUES (@user_id, @user_type, @order_type);

                SELECT SCOPE_IDENTITY() AS order_id;
            `);

    const order_id = orderResult.recordset[0].order_id;

    for (let item of cartItems) {
      await pool
        .request()
        .input("order_id", sql.Int, order_id)
        .input("product_id", sql.Int, item.product_id) 
        .input("quantity", sql.Int, item.qty)
        .input("amount", sql.Decimal(10, 2), item.price).query(`
                    INSERT INTO ORDER_ITEMS (order_id, item_id, quantity, amount)
                    VALUES (@order_id, @product_id, @quantity, @amount)
                `);
    }

    return res.json({
      success: true,
      message: "Stationery request created successfully",
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

const storage = multer.diskStorage({
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

const upload = multer({ storage: storage });

const addstationery = async (req, res) => {
  const { category, productname, price, quantity } = req.body;
  const image = req.file.filename;

  console.log("image", image);
  console.log(category + productname + price + quantity);
  try {
    const pool = await poolPromise;

    if (!image || !category || !productname || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const images = req.file; // multer uploaded file object
    const imagePath = `/uploads/${images.filename}`;
    console.log(imagePath);
    await pool
      .request()
      .input("image", sql.VarChar, imagePath)
      .input("category", sql.VarChar, category)
      .input("productname", sql.VarChar, productname)
      .input("price", sql.Decimal(10, 2), price)
      .input("quantity", sql.Int, quantity).query(`
                INSERT INTO Stationery (product_img, category, name, price, stock)
                VALUES (@image, @category, @productname, @price, @quantity);
            `);

    return res.json({
      success: true,
      message: "Stationery product added successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getallorders = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT 
  o.order_id,
  COALESCE(s.St_firstname + ' ' + s.St_lastname , e.Emp_firstname+' '+e.Emp_lastname) AS fullname,
o.user_id,
  o.created_at,
  o.status,
  o.user_type,
  ns.title,
  ns.Course_no,
  ns.week_no,
  n.copies,
  n.color_mode,
  n.print_sides,
  n.pickup_time

FROM ORDERS o

INNER JOIN Note_Print_detail n 
  ON o.order_id = n.order_id

LEFT JOIN STMTR s 
  ON s.Reg_No = o.user_id

LEFT JOIN EMPMTR e 
  ON e.Emp_no = o.user_id

JOIN Notes ns 
  ON ns.note_id = n.note_id

WHERE o.status ='pending'
ORDER BY o.created_at asc;
        `);

    const stationeryorder = await pool.request().query(`

  SELECT 
  o.order_id,

  COALESCE(
    st.St_firstname + ' ' + st.St_lastname,
    e.Emp_firstname + ' ' + e.Emp_lastname
  ) AS fullname,

  o.created_at,
  o.user_id,
  o.status,
  o.user_type,
  o.order_type,

  (
    SELECT 
      oi.id,
      oi.quantity,
      s.name,
      oi.amount
    FROM ORDER_ITEMS oi
    LEFT JOIN Stationery s 
      ON s.product_id = oi.item_id
    WHERE oi.order_id = o.order_id
    FOR JSON PATH
  ) AS items

FROM ORDERS o 

LEFT JOIN STMTR st 
  ON st.Reg_No = o.user_id

LEFT JOIN EMPMTR e 
  ON e.Emp_no = o.user_id

WHERE 
  o.status = 'pending'
  AND o.order_type = 'stationery'
 

ORDER BY o.created_at ASC;

        `);





    res.json({
      success: true,
      message: "Order details fetched successfully",
      data: result.recordset,
      storder: stationeryorder.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};


const sendnotificationbyshopkeeper=async(req,res)=>{
const {order_id,shopkeeper_id,status}=req.body;
if(!order_id || !shopkeeper_id){
    return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
}
try{

    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT user_id ,order_type
        FROM ORDERS 
        WHERE order_id = '${order_id}';
      `);
    //    abi ka time date 
    

      const user_id = result.recordset[0].user_id;
     
     const user_type="shopkeeper";

      const order_type=result.recordset[0].order_type;
      const message=`your ${order_type} Order is ${status}`;
      const ref_id=order_id;

   
   await pool.request().query(`
   INSERT INTO NOTIFICATIONS (sender_id, receiver_id, message, user_type, reference_id)
   VALUES ('${shopkeeper_id}', '${user_id}', '${message}', '${user_type}', '${ref_id}');
   `);
    res.json({
        success: true,
        message: "Notification sent successfully",
      });

}catch(err){
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
}
    


}

const receivednotification=async(req,res)=>{
   const user_id = req.query.user_id;
  console.log("User ID:", user_id);

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID required",
    });
  }
    try{
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT * FROM Notifications
            WHERE receiver_id = '${user_id}'
            and is_read=0
            ORDER BY created_at DESC;

          `);
        res.json({
            success: true,
            message: "Notifications fetched successfully",
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
const confirmorder = async (req, res) => {
  const { order_id } = req.body;
console.log("oooooooo",order_id)
  try {
    const pool = await poolPromise;

    const result = await pool.request()
     
      .query(`
        SELECT 
          oi.item_id, 
          oi.quantity AS order_qty,
          s.stock AS available_stock
        FROM ORDER_ITEMS oi
        JOIN Stationery s ON s.product_id = oi.item_id
        WHERE oi.order_id = '${order_id}';
      `);

    const items = result.recordset;

    const insufficientItems = items.filter(item => item.order_qty > item.available_stock);

    if (insufficientItems.length > 0) {
      
      await pool.request()
        
        .query(`
          UPDATE ORDERS
          SET status = 'rejected'
          WHERE order_id ='${order_id}';
        `);

      return res.status(400).json({
        success: false,
        message: "Order rejected due to insufficient stock",
        
      });
    }

    await pool.request()
   
      .query(`
        UPDATE ORDERS
        SET status = 'accepted'
        WHERE order_id ='${order_id}';
      `);

    // 4️⃣ Reduce stock
    for (const item of items) {
      await pool.request()
       
        .query(`
          UPDATE Stationery
          SET stock = stock - ${item.order_qty}
          WHERE product_id = '${item.item_id}';
        `);
    }

  res.status(200).json({
  success: true,
  message: "Order confirmed successfully",
});

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const removenotification=async(req,res)=>{


  const notification_id=req.query.no_id;
  try{
      const pool = await poolPromise;
     await pool.request().query(`
          DELETE FROM Notifications
          WHERE notification_id = '${notification_id}';
        `);
      res.status(200).json({
          success: true,
          message: "Notification removed successfully",
        });
  }catch(err){
      console.error(err); 
      res.status(500).json({
        success: false,
        error: err.message,
      });
  }

}

//   axios.delete(`http://localhost:3000/api/deleteorder/${order_id}`)
const removeorder=async(req,res)=>{
   const { order_id } = req.params; // Get order_id from URL parameter
    
    // Validate order_id
    if (!order_id) {
      return res.status(400).json({
        status: 400,
        message: "Order ID is required"
      });
    }
 
    try{
        const pool = await poolPromise;


         await pool.request().query(`
            DELETE FROM ORDER_ITEMS
            WHERE order_id = '${order_id}';
          `);
       await pool.request().query(`
            DELETE FROM ORDERS
            WHERE order_id = '${order_id}';
          `);
        res.status(200).json({
            success: true,
            message: "Order removed successfully",
          });
    }catch(err){
        console.error(err); 
        res.status(500).json({
          success: false,
          error: err.message,
        });
    }
}

const allordercount=async(req,res)=>{
 try {
    const pool = await poolPromise;

    const pendingorder = await pool.request().query(`
                SELECT COUNT(*) AS total_orders 
                FROM ORDERS 
               
                where  status='pending'
            `);
               const readyorder = await pool.request().query(`
                SELECT COUNT(*) AS total_orders 
                FROM ORDERS 
               
                where  status='completed'
            `);
 return res.status(200).json({
      success: true,
      message: "Order status fetched successfully",
     pendingorder: pendingorder.recordset[0].total_orders, // Return the count directly
      readyorder: readyorder.recordset[0].total_orders, 
    });

  

  
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}

module.exports = {
  Login,
  EnrollerdCourses,
  TeacherCoursesnotes,
  Stationery,
  Wallet,
  NotesPrintRequest,
  CreateNotePrintRequest,
  updatewalletamount,
  ordercount,
  orderdetail,
  stationerybuyrequest,
  ShopkeeperLogin,
  addstationery,
  upload,
  getallorders,
  confirmorder,
  sendnotificationbyshopkeeper,
  receivednotification,
  removenotification,
  removeorder,
  allordercount,
  teacherlogin
};

