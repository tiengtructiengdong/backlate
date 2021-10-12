var jwt = require("jsonwebtoken");

module.exports = (app, con) => {
  app.post("/auth/login", (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM User WHERE Username = '${username}' AND Password = '${password}'`;

    con.query(query, (err, userData) => {
      if (err) {
        res.status(500).json({
          message: err.sqlMessage,
        });
        return;
      }
      if (username && password) {
        if (userData.length >= 1) {
          // if user is found
          // Log in from other device: update token?

          /*var json = JSON.parse(JSON.stringify(userData[0]));
          if (json.UserToken) {
            res.status(400).json({
              message: "Already logged in",
            });
            return;
          }*/

          const token = jwt.sign({ foo: username }, password);

          const query = `UPDATE User SET UserToken = '${token}' WHERE Username = '${username}' AND Password = '${password}'`;
          con.query(query, (err, userData) => {
            if (err) {
              res.status(500).json({
                message: err.sqlMessage,
              });
              return;
            }
            res.json({
              username: username,
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
    const { username } = req.body;

    const query = `SELECT * FROM User WHERE Username = '${username}'`;

    con.query(query, (err, userData) => {
      if (err) {
        res.status(500).json({
          message: err.sqlMessage,
        });
        return;
      }
      if (username) {
        const query = `UPDATE User SET UserToken = NULL WHERE Username = '${username}'`;
        con.query(query, (err, userData) => {
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
    const { name, userId, username, phoneNumber, password } = req.body;
    var id;
    var error;

    const query = `INSERT INTO User(Name, UserId, Username, PhoneNumber, Password) 
                    VALUES('${name}', '${userId}', '${username}', '${phoneNumber}', '${password}')`;

    con.query(query, (err, sqlResult) => {
      if (err) {
        console.log(err.sqlMessage);
        return;
      }
      console.log("New user is added\n", sqlResult);
      id = res.insertId;
    });
    if (error) {
      console.log(error);
    }
    res.json({
      id: id,
      name: name,
      userId: userId,
      username: username,
      phoneNumber: phoneNumber,
    });
  });
};
