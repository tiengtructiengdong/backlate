var jwt = require("jsonwebtoken");

module.exports = (app, pool) => {
  app.post("/auth/login", (req, res) => {
    const { number, password } = req.body;

    const query = `SELECT * FROM User WHERE (PhoneNumber = '${number}' OR Id = '${number}') AND Password = '${password}'`;

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
          // if user is found
          // Log in from other device: update token?

          /*if (json.UserToken) {
            res.status(400).json({
              message: "Already logged in",
            });
            return;
          }*/

          const token = jwt.sign({ foo: number }, password);

          const query = `UPDATE User SET UserToken = '${token}' 
                          WHERE (PhoneNumber = '${number}' OR Id = '${number}') AND Password = '${password}'`;
          pool.query(query, (err, userData) => {
            if (err) {
              res.status(500).json({
                message: err.sqlMessage,
              });
              return;
            }
            res.json({
              id: json.Id,
              firstName: json.FirstName,
              lastName: json.LastName,
              phoneNumber: json.PhoneNumber,
              isVerified: json.IsVerified,
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

    const query = `SELECT * FROM User WHERE Id = '${id}'`;

    pool.query(query, (err, userData) => {
      if (err) {
        res.status(500).json({
          message: err.sqlMessage,
        });
        return;
      }
      if (phoneNumber) {
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
      }
    });
  });

  app.post("/auth/register", (req, res) => {
    const { id, firstName, lastName, phoneNumber, password } = req.body;

    const query = `INSERT INTO User(Id, FirstName, LastName, PhoneNumber, Password) 
                    VALUES('${id}', '${firstName}', '${lastName}', '${phoneNumber}', '${password}')`;

    pool.query(query, (err, sqlResult) => {
      if (err) {
        res.status(400).json({
          message: err,
        });
        return;
      }
      console.log("New user is added\n", sqlResult);
      res.json({
        userId: id,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
      });
    });
  });

  app.post("/auth/verify", (req, res) => {
    const { id } = req.body;

    const query = `UPDATE User SET IsVerified = 1 WHERE Id = '${id}'`;

    pool.query(query, (err, sqlResult) => {
      if (err) {
        res.status(400).json({
          message: err,
        });
        return;
      }
      console.log("Verified!\n", sqlResult);
      res.json({
        id: id,
        message: "Verified!",
      });
    });
  });
};
