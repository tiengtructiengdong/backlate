var jwt = require("jsonwebtoken");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);
  const areaCode = [
    1, 2, 4, 6, 8, 10, 11, 12, 14, 15, 17, 19, 20, 22, 24, 25, 26, 27, 30, 31,
    33, 34, 35, 36, 37, 38, 40, 42, 44, 45, 46, 48, 49, 51, 52, 54, 56, 58, 60,
    62, 64, 66, 67, 68, 70, 72, 74, 75, 77, 79, 80, 82, 83, 84, 86, 87, 89, 91,
    92, 93, 94, 95, 96,
  ];
  const areaCodeStr = areaCode.map((code) => String(code).padStart(3, "0"));

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
    const validateInput = (body) => {
      const { officialId, fullName, phoneNumber, password, address, name } =
        body;

      if (
        officialId == "" ||
        officialId == undefined ||
        fullName == "" ||
        fullName == undefined ||
        phoneNumber == "" ||
        phoneNumber == undefined ||
        password == "" ||
        password == undefined ||
        address == "" ||
        address == undefined ||
        name == "" ||
        name == undefined
      ) {
        throw new Error("Please fill in the required fields.");
      }
    };

    const validateOfficialId = (id) => {
      const invalidStr = "Invalid ID number.";

      if (id.length != 12 && id.length != 9) {
        throw new Error(invalidStr);
      }
      const digits = id.split("").map((char) => parseInt(char));
      const isContainInvalidChar = digits.includes(NaN);

      if (isContainInvalidChar) {
        throw new Error(invalidStr);
      }

      if (digits.length == 12) {
        // check first 3 number
        const head = id.substring(0, 3);
        if (!areaCodeStr.includes(head)) {
          throw new Error(invalidStr);
        }

        // check 4th
        if (digits[3] >= 4) {
          throw new Error(invalidStr);
        }
      }
    };

    const validatePhoneNumber = (num) => {};

    const validatePassword = (pass) => {};

    try {
      validateInput(req.body);

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

      validateOfficialId(officialId);
      validatePhoneNumber(phoneNumber);
      validatePassword(password);

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
        message: err.message,
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
