var jwt = require("jsonwebtoken");

const authenticate = (username, password) => {
  var token = jwt.sign({ foo: username }, password);
  console.log(token);
  return {
    token: token,
  };
};

module.exports = (app, session, con) => {
  app.post("/auth/login", (req, res) => {
    if (session.user) {
      res.json({
        message: "Already logged in",
      });
    }
    const { username, password } = req.body;

    const query = `SELECT * FROM User WHERE Username = '${username}' AND Password = '${password}'`;

    con.query(query, (err, userData) => {
      if (err) {
        console.log(err.sqlMessage);
        return;
      }
      if (username && password) {
        if (userData.length >= 1) {
          // proceed login

          session = req.session;
          session.username = username;
          res.json({
            username: username,
            ...authenticate(username, password),
          });
        } else {
          res.status(401).json({
            message: "Invalid username or password",
          });
        }
      } else {
        res.status(400).json({
          message: "Missing input!",
        });
      }
    });
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.json({
          message: "Cannot logout",
        });
        return;
      }
    });
    res.json({
      message: "Logout",
    });
  });

  app.post("/auth/register", (req, res) => {
    const { name, userId, username, email, password } = req.body;
    var id;
    var error;

    const query = `INSERT INTO User(Name, UserId, Username, Email, Password) 
                    VALUES('${name}', '${userId}', '${username}', '${email}', '${password}')`;

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
      email: email,
    });
  });
};
