var jwt = require("jsonwebtoken");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.post("/auth/login", (req, res) => {
    const { number, password } = req.body;

    const query = `SELECT * FROM User WHERE (PhoneNumber = '${number}' OR OfficialId = '${number}') AND Password = '${password}'`;

    pool.query(query, (err, userData) => {
      if (err) {
        res.status(500).json({
          message: err.sqlMessage,
        });
        return;
      }
      if (number && password) {
        if (userData.length >= 1) {
          var json = JSON.parse(JSON.stringify(userData[0]));
          console.log(json);

          const token = jwt.sign({ foo: number }, password);

          const query = `UPDATE User SET UserToken = '${token}' 
                          WHERE (PhoneNumber = '${number}' OR OfficialId = '${number}') AND Password = '${password}'`;
          pool.query(query, (err, userData) => {
            if (err) {
              res.status(500).json({
                message: err.sqlMessage,
              });
              return;
            }
            res.json({
              id: json.Id,
              officialId: json.OfficialId,
              fullName: json.FullName,
              phoneNumber: json.PhoneNumber,
              token: token,
            });
          });
          return;
        }

        // if user not found
        res.status(401).json({
          message: "Invalid username or password",
        });
        return;
      }
      res.status(400).json({
        message: "Missing input!",
      });
    });
  });

  app.post("/auth/logout", (req, res) => {
    const { id } = req.body;

    const query = `UPDATE User SET UserToken = NULL WHERE Id = '${id}'`;
    pool.query(query, (err, userData) => {
      if (err) {
        res.status(500).json({
          message: err.sqlMessage,
        });
        return;
      }
      res.json({
        message: "Logout",
      });
      return;
    });
  });

  app.post("/auth/register", async (req, res) => {
    const {
      officialId,
      fullName,
      phoneNumber,
      password,
      address,
      name,
      spaceCount,
      defaultFee,
    } = req.body;

    if (
      officialId == "" ||
      fullName == "" ||
      phoneNumber == "" ||
      password == "" ||
      address == "" ||
      name == ""
    ) {
      res.status(400).json({
        message: "Inputs cannot be blank!",
      });
      return;
    }

    try {
      var query = `INSERT INTO User(OfficialId, FullName, PhoneNumber, Password) 
                    VALUES('${officialId}', '${fullName}', '${phoneNumber}', '${password}')`;
      var data = await asyncQuery(query);

      const ownerId = data.insertId;
      query = `
        INSERT INTO ParkingLot (OwnerId, Name, Address, SpaceCount) 
        VALUES (${ownerId},'${name}','${address}',${spaceCount || 0})`;

      data = await asyncQuery(query);

      const parkingLotId = data.insertId;
      query = `
        INSERT INTO Membership (ParkingLotId, Name, Fee, Level) 
        VALUES (${parkingLotId}, 'Default', '${JSON.stringify(
        defaultFee
      )}', 0)`;

      data = await asyncQuery(query);

      console.log("New user is added\n", data);
      res.json({
        message: "Successful",
        officialId: officialId,
        fullName: fullName,
        phoneNumber: phoneNumber,
      });
    } catch (err) {
      res.status(400).json({
        message: err,
      });
    }
  });

  app.post("/auth/verify", (req, res) => {
    const { officialId } = req.body;

    const query = `UPDATE User SET IsVerified = 1 WHERE OfficialId = '${officialId}'`;

    pool.query(query, (err, sqlResult) => {
      if (err) {
        res.status(400).json({
          message: err,
        });
        return;
      }
      console.log("Verified!\n", sqlResult);
      res.json({
        officialId: officialId,
        message: "Verified!",
      });
    });
  });
};
