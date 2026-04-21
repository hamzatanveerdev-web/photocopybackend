const { poolPromise } = require("../db");
const multer = require("multer");
const fs = require("fs");
const sql = require("mssql/msnodesqlv8");

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

// stationery product data get function
const Stationery = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query`SELECT  * FROM Stationery`;
    const count = await pool.request().query`SELECT COUNT(*) AS total FROM Stationery`;
    
    const products = result.recordset.map((item) => ({
      ...item,
      imagePath: `http://localhost:3000${item.product_img}`,
    }));

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      total: count.recordset[0].total,
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

//fetch stationery by id
const Stationerygetbyid = async (req, res) => {
  const id = req.params.id;

  try {
    console.log(id);
    const pool = await poolPromise;
    const result = await pool.request().query`SELECT  * FROM Stationery where product_id=${id}`;
     
    const products = result.recordset.map((item) => ({
      ...item,
      imagePath: `http://localhost:3000${item.product_img}`,
    }));

    res.json({
      success: true,
      message: "Products fetched successfully",
      data: products[0],
    });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

//edit stationery
const editstationery = async (req, res) => {
  const id = req.params.id;
  const { category, productname, price, quantity } = req.body;
  

  try {

    const pool = await poolPromise;
   
    await pool.request().query`UPDATE Stationery SET category = ${category},name = ${productname}, price = ${price}, stock = ${quantity} WHERE product_id = ${id}`;
    res.json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// remove stationery product
const removestationery = async (req, res) => {
  const id = req.params.id;
  try {
    const pool = await poolPromise;
    await pool.request().query`DELETE FROM Stationery WHERE product_id = ${id}`;
    res.json({ success: true, message: "Product removed successfully" });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

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
    console.log("users", reg_no, emp_no);
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

module.exports = {
  Stationery,
  Stationerygetbyid,
  editstationery,
  removestationery,
  addstationery,
  upload,
  stationerybuyrequest,
};
