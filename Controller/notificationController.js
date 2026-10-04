const sql = require("mssql/msnodesqlv8");
const { poolPromise } = require("../db");

const createNotification = async (req, res) => {
  const {
    receiver_id,
    receiver_role,
    sender_id,
    sender_role,
    notification_type,
    title,
    message,
    reference_id,
    reference_type,
    is_read,
  } = req.body;

  if (!receiver_id || !receiver_role || !notification_type || !title || !message) {
    return res.status(400).json({
      success: false,
      message: "receiver_id, receiver_role, notification_type, title and message are required",
    });
  }

  try {
    const pool = await poolPromise;

    await pool
      .request()
      .input("receiver_id", sql.VarChar(50), receiver_id)
      .input("receiver_role", sql.VarChar(20), receiver_role)
      .input("sender_id", sql.VarChar(50), sender_id || null)
      .input("sender_role", sql.VarChar(20), sender_role || null)
      .input("notification_type", sql.VarChar(50), notification_type)
      .input("title", sql.VarChar(200), title)
      .input("message", sql.VarChar(500), message)
      .input("reference_id", sql.Int, reference_id ?? null)
      .input("reference_type", sql.VarChar(50), reference_type || null)
      .input("is_read", sql.Bit, is_read === true || is_read === 1 ? 1 : 0).query(`
        INSERT INTO Notifications (
          receiver_id, receiver_role, sender_id, sender_role,
          notification_type, title, message, reference_id, reference_type, is_read
        )
        VALUES (
          @receiver_id, @receiver_role, @sender_id, @sender_role,
          @notification_type, @title, @message, @reference_id, @reference_type, @is_read
        );
      `);

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
    });
  } catch (err) {
    console.error("Create notification error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const sendnotification = async (req, res) => {
  const { order_id, shopkeeper_id, status } = req.body;

  if (!order_id || !shopkeeper_id) {
    return res.status(400).json({
      success: false,
      message: "Order ID and shopkeeper ID are required",
    });
  }

  try {
    const pool = await poolPromise;
    const orderResult = await pool.request().query(`
    SELECT
o.user_id , o.user_type, o.order_type,
    COALESCE(n.title, bs.title) AS note_title,
    COALESCE(n.week_no, bs.week_no) AS note_week

FROM ORDERS o

JOIN Note_Print_detail npd
    ON o.order_id = npd.order_id

LEFT JOIN NOTES n
    ON n.note_id = npd.teacher_note_id

LEFT JOIN brilliantStudentNotes bs
    ON bs.note_id = npd.student_note_id

	where o.order_id='${order_id}'
    `);

    if (!orderResult.recordset[0]) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
   const title = orderResult.recordset[0].note_title;
const weekno = orderResult.recordset[0].note_week;

const weektitle = `${title} - Week ${weekno}`;
    const receiver_id = orderResult.recordset[0].user_id;
    const receiver_role = orderResult.recordset[0].user_type || "student";
    const order_type = orderResult.recordset[0].order_type;
    const message = `Your ${order_type} order ${weektitle} is ${status}`;
  
    console.log(message)
    await pool
      .request()
      .input("receiver_id", sql.VarChar(50), receiver_id)
      .input("receiver_role", sql.VarChar(20), receiver_role)
      .input("sender_id", sql.VarChar(50), shopkeeper_id)
      .input("sender_role", sql.VarChar(20), "shopkeeper")
      .input("notification_type", sql.VarChar(50), "ORDER_STATUS_UPDATE")
      .input("title", sql.VarChar(200), "Order Status")
      .input("message", sql.VarChar(500), message)
      .input("reference_id", sql.Int, Number(order_id))
      .input("reference_type", sql.VarChar(50), "ORDER")
      .input("is_read", sql.Bit, 0).query(`
        INSERT INTO Notifications (
          receiver_id, receiver_role, sender_id, sender_role,
          notification_type, title, message, reference_id, reference_type, is_read
        )
        VALUES (
          @receiver_id, @receiver_role, @sender_id, @sender_role,
          @notification_type, @title, @message, @reference_id, @reference_type, @is_read
        );
      `);

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error("Send notification error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};


const receivednotification = async (req, res) => {
  const user_id = req.query.user_id || req.query.receiver_id;
  const user_type = req.query.user_type || req.query.receiver_role;

  if (!user_id || !user_type) {
    return res.status(400).json({
      success: false,
      message: "User ID and User Type are required",
    });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("receiver_id", sql.VarChar(50), user_id)
      .input("receiver_role", sql.VarChar(20), user_type).query(`
        SELECT *
        FROM Notifications
        WHERE receiver_id = @receiver_id
          AND receiver_role = @receiver_role
        ORDER BY created_at DESC;
      `);

    return res.json({
      success: true,
      message: "Notifications fetched successfully",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Received notification error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const removenotification = async (req, res) => {
  const notification_id = req.query.no_id || req.params.id;

  if (!notification_id) {
    return res.status(400).json({
      success: false,
      message: "Notification ID is required",
    });
  }

  try {
    const pool = await poolPromise;
    await pool
      .request()
      .input("notification_id", sql.Int, Number(notification_id)).query(`
        DELETE FROM Notifications
        WHERE notification_id = @notification_id;
      `);

    return res.status(200).json({
      success: true,
      message: "Notification removed successfully",
    });
  } catch (err) {
    console.error("Remove notification error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  createNotification,
  sendnotification,
  receivednotification,
  removenotification,
};
