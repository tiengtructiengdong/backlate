var jwt = require("jsonwebtoken");
const { promisify } = require("util");
const { nanoid } = require("nanoid");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);
  const areaCode = [
    1, 2, 4, 6, 8, 10, 11, 12, 14, 15, 17, 19, 20, 22, 24, 25, 26, 27, 30, 31,
    33, 34, 35, 36, 37, 38, 40, 42, 44, 45, 46, 48, 49, 51, 52, 54, 56, 58, 60,
    62, 64, 66, 67, 68, 70, 72, 74, 75, 77, 79, 80, 82, 83, 84, 86, 87, 89, 91,
    92, 93, 94, 95, 96,
  ];
  const areaCodeStr = areaCode.map((code) => String(code).padStart(3, "0"));

  const checkPassword = (password) => {
    const strong =
      /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/g;
    const medium =
      /((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{6,}))|((?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9])(?=.{8,}))/g;

    if (strong.test(password)) {
      return "Strong";
    }
    if (medium.test(password)) {
      return "Medium";
    }
    return "Weak";
  };

  app.post("/auth/login", async (req, res) => {
    const { number, password } = req.body;

    try {
      if (!number || !password) {
        throw new Error("Please fill in the required fields.");
      }

      var query = `
        SELECT Id, OfficialId, FullName, PhoneNumber, IsVerified
        FROM User 
        WHERE 
          (PhoneNumber = '${number}' OR OfficialId = '${number}') 
          AND
            CONCAT(
              SUBSTRING(Password, 1, 8), 
              SHA(CONCAT(SUBSTRING(Password, 1, 8), SUBSTRING(Password, 49, 56), '${password}')), 
              SUBSTRING(Password, 49, 56)
            ) = Password
        `;
      var data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("Invalid username or password");
      }

      var json = JSON.parse(JSON.stringify(data[0]));
      console.log(json);

      const token = jwt.sign({ foo: number }, password);

      query = `UPDATE User SET UserToken = '${token}' 
        WHERE (PhoneNumber = '${number}' OR OfficialId = '${number}')`;

      data = await asyncQuery(query);
      res.json({
        id: json.Id,
        officialId: json.OfficialId,
        fullName: json.FullName,
        phoneNumber: json.PhoneNumber,
        token: token,
      });
    } catch (err) {
      res.status(400).json({
        message: err.message,
      });
    }
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
      idDate,
      fullName,
      phoneNumber,
      password,
      address,
      name,
      spaceCount,
      defaultFee,
    } = req.body;

    const validateInput = () => {
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
        defaultFee == "" ||
        defaultFee == undefined ||
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

    const validatePassword = (pass) => {
      if (checkPassword(pass) === "Weak") {
        throw new Error("Your password must have at least 6 characters long.");
      }
    };

    try {
      validateInput();

      validateOfficialId(officialId);
      validatePhoneNumber(phoneNumber);
      validatePassword(password);

      const boom_a = nanoid(8);
      const boom_b = nanoid(8);

      const database_pw = `${boom_a}${boom_b}${password}`;
      console.log(database_pw);

      var query = `
        INSERT INTO User(OfficialId, FullName, PhoneNumber, Password) 
        VALUES(
          '${officialId}', 
          '${fullName}', 
          '${phoneNumber}', 
          CONCAT('${boom_a}', SHA('${database_pw}'), '${boom_b}') 
        )
      `;
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
      const sql_error = err.message?.split(":")[0] || "";
      var message = err.message;

      if (sql_error == "ER_DUP_ENTRY") {
        message = "This ID number or phone number has been registered!";
      }

      res.status(400).json({
        message,
      });
    }
  });

  app.post("/auth/checkPassword", async (req, res) => {
    const { password } = req.body;

    res.json({
      strength: checkPassword(password),
    });
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
