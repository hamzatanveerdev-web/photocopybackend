const { poolPromise } = require("../db");
const sql = require("mssql/msnodesqlv8");
//wallet 
const Wallet = async (req, res) => {
  const user_id = req.query.user_id
  try {
    console.log(user_id);
    const pool = await poolPromise;

    const result = await pool.request()
      .query`select balance from wallet where user_ref_id=${user_id}`;
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

const updatewalletamount = async (req, res) => {
  const { user_id, amount, description } = req.body;
  const shopkeeper_id = 1;

  if (!user_id)  {
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
const transactions=async(req,res)=>{
const user_id=req.query.user_id;
if(!user_id){
return res.status(400).json({
      success: false,
      message: "User ID required",
    });
}
try{
 const pool = await poolPromise;
console.log(user_id)
    const result = await pool.request().query(`
               select amount ,transaction_type,created_at,description from TRANSACTIONS where user_ref_id='${user_id}'
            `);
    return res.json({
      success: true, 
      message: "Order status fetched successfully",
      data: result.recordset,
    });


}catch (err) {
      console.error(err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
     
    }
}
module.exports = {
  updatewalletamount,
  Wallet,
  transactions
};
