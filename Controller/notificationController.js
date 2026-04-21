const { poolPromise } = require("../db");

const sendnotificationbyshopkeeper = async (req, res) => {
  const { order_id, shopkeeper_id, status } = req.body;
  if (!order_id || !shopkeeper_id) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT user_id ,order_type
        FROM ORDERS 
        WHERE order_id = '${order_id}';
      `);
    //    abi ka time date

    const user_id = result.recordset[0].user_id;

    const user_type = "shopkeeper";

    const order_type = result.recordset[0].order_type;
    const message = `your ${order_type} Order is ${status}`;
    const ref_id = order_id;

    console.log("notification is ", message);

    await pool.request().query(`
   INSERT INTO NOTIFICATIONS (sender_id, receiver_id, message, user_type, reference_id)
   VALUES ('${shopkeeper_id}', '${user_id}', '${message}', '${user_type}', '${ref_id}');
   `);
    return res.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const receivednotification = async (req, res) => {
  const user_id = req.query.user_id;
  console.log("User ID:", user_id);

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID required",
    });
  }
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
            SELECT * FROM Notifications
            WHERE receiver_id = '${user_id}'
            and is_read=0
            ORDER BY created_at DESC;

          `);
    return res.json({
      success: true,
      message: "Notifications fetched successfully",
      data: result.recordset,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

const removenotification = async (req, res) => {
  const notification_id = req.query.no_id;
  try {
    const pool = await poolPromise;
    await pool.request().query(`
          DELETE FROM Notifications
          WHERE notification_id = '${notification_id}';
        `);
    res.status(200).json({
      success: true,
      message: "Notification removed successfully",
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
  sendnotificationbyshopkeeper,
  receivednotification,
  removenotification,
};
