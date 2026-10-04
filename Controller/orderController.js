const { poolPromise } = require("../db");

const getallorders = async (req, res) => {
  const photocopier_id = req.query.photocopier_id;
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
    	SELECT 
    o.order_id,
    COALESCE(s.St_firstname + ' ' + s.St_lastname, e.Emp_firstname + ' ' + e.Emp_lastname) AS fullname,
    o.user_id,
    o.created_at,
    o.status,
    o.user_type,

    COALESCE(ns.title, bs.title, pn.title) AS title,
    COALESCE(ns.Course_no, '-') AS course_no,
    COALESCE(ns.week_no, bs.week_no) AS week_no,

    n.copies,
    n.color_mode,
    n.print_sides,
    n.pickup_time,

    CASE 
        WHEN n.teacher_note_id IS NOT NULL THEN 'Course Note'
        WHEN n.student_note_id IS NOT NULL THEN 'Student Note'
        WHEN n.personal_note_id IS NOT NULL THEN 'Personal Note'
        ELSE 'Unknown'
    END AS note_type

FROM ORDERS o

INNER JOIN Note_Print_detail n 
    ON o.order_id = n.order_id

LEFT JOIN STMTR s 
    ON s.Reg_No = o.user_id

LEFT JOIN EMPMTR e 
    ON e.Emp_no = o.user_id

LEFT JOIN Notes ns 
    ON ns.note_id = n.teacher_note_id  

LEFT JOIN brilliantStudentNotes bs 
    ON bs.note_id = n.student_note_id  

LEFT JOIN PersonalNotes pn 
    ON pn.personal_note_id = n.personal_note_id  

WHERE o.status NOT IN ('rejected', 'delivered')
and o.photocopier_id='${photocopier_id}'
ORDER BY o.created_at ASC;



        `);

//     const stationeryorder = await pool.request().query(`

//   SELECT 
//   o.order_id,

//   COALESCE(
//     st.St_firstname + ' ' + st.St_lastname,
//     e.Emp_firstname + ' ' + e.Emp_lastname
//   ) AS fullname,

//   o.created_at,
//   o.user_id,
//   o.status,
//   o.user_type,
//   o.order_type,

//   (
//     SELECT 
//       oi.id,
//       oi.quantity,
//       s.name,
//       oi.amount
//     FROM ORDER_ITEMS oi
//     LEFT JOIN Stationery s 
//       ON s.product_id = oi.item_id
//     WHERE oi.order_id = o.order_id
//     FOR JSON PATH
//   ) AS items

// FROM ORDERS o 

// LEFT JOIN STMTR st 
//   ON st.Reg_No = o.user_id

// LEFT JOIN EMPMTR e 
//   ON e.Emp_no = o.user_id

// WHERE  o.order_type = 'stationery'

//   AND o.status NOT IN ('rejected', 'delivered')


// ORDER BY o.created_at ASC;

//         `);

    res.json({
      success: true,
      message: "Order details fetched successfully",
      data: result.recordset,
      // storder: stationeryorder.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const confirmorder = async (req, res) => {
  const { order_id, O_status } = req.body;
  console.log("order_id", order_id, O_status);
  try {
    const pool = await poolPromise;

    // const result = await pool.request().query(`
    //     SELECT 
    //       oi.item_id, 
    //       oi.quantity AS order_qty,
    //       s.stock AS available_stock
    //     FROM ORDER_ITEMS oi
    //     JOIN Stationery s ON s.product_id = oi.item_id
    //     WHERE oi.order_id = '${order_id}';
    //   `);

    // const items = result.recordset;

    // const insufficientItems = items.filter(
    //   (item) => item.order_qty > item.available_stock,
    // );

    // if (insufficientItems.length > 0) {
    //   await pool.request().query(`
    //       UPDATE ORDERS
    //       SET status = 'rejected'
    //       WHERE order_id ='${order_id}';
    //     `);

    //   return res.status(400).json({
    //     success: false,
    //     message: "Order rejected due to insufficient stock",
    //   });
    // }

    await pool.request().query(`
        UPDATE ORDERS
        SET status='${O_status}'
        WHERE order_id ='${order_id}';
      `);

  
    // for (const item of items) {
    //   await pool.request().query(`
    //       UPDATE Stationery
    //       SET stock = stock - ${item.order_qty}
    //       WHERE product_id = '${item.item_id}';
    //     `);
    // }

    return res.status(200).json({
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

const removeorder = async (req, res) => {
  const { order_id } = req.params; 

  if (!order_id) {
    return res.status(400).json({
      status: 400,
      message: "Order ID is required",
    });
  }

  try {
    const pool = await poolPromise;

    await pool.request().query(`
            DELETE FROM Note_Print_detail
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const allordercount = async (req, res) => {
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
      pendingorder: pendingorder.recordset[0].total_orders,
      readyorder: readyorder.recordset[0].total_orders,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const updateorderstatus = async (req, res) => {
  const { order_id, O_status } = req.body;

  try {
    const pool = await poolPromise;
    await pool.request().query(`
            UPDATE ORDERS
            SET status = '${O_status}'
            WHERE order_id='${order_id}';
          `);

    return res.status(200).json({
      success: true,
      message: "Order completed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const getHistory = async (req, res) => {
  const user_id = req.query.user_id;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID required",
    });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`

     SELECT 
    o.order_id,
    o.user_id,

    COALESCE(s.St_firstname + ' ' + s.St_lastname,
             e.Emp_firstname + ' ' + e.Emp_lastname) AS fullname,

    o.user_type,
    o.order_type,
    o.status,
    o.created_at,

    n.copies,
    n.color_mode,
    n.print_sides,
    n.pickup_time,

    COALESCE(ns.title, bs.title, pn.title) AS title,

      COALESCE(ns.file_url, bs.FilePath, pn.file_path) AS file_url,
    COALESCE(ns.Course_no, bs.Course_no, '-') AS course_no,
    COALESCE(ns.week_no, '-') AS week_no 

FROM ORDERS o 

LEFT JOIN Note_Print_detail n 
    ON o.order_id = n.order_id

LEFT JOIN STMTR s 
    ON o.user_id = s.Reg_no

LEFT JOIN EMPMTR e 
    ON e.Emp_no = o.user_id

LEFT JOIN Notes ns 
    ON ns.note_id = n.teacher_note_id

LEFT JOIN brilliantStudentNotes bs 
    ON bs.note_id = n.student_note_id

LEFT JOIN PersonalNotes pn 
    ON pn.personal_note_id = n.personal_note_id

WHERE o.user_id = '${user_id}'
  AND o.status = 'delivered'  

ORDER BY o.created_at DESC;

     `);

    return res.json({
      success: true,
      message: "Delivered orders fetched successfully",
      notedata: result.recordset
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
  getallorders,
  confirmorder,
  removeorder,
  allordercount,
  updateorderstatus,
  getHistory,
};
