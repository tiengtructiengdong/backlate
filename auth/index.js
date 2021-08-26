const authenticate = (username, password) => {
  return {
    token: "1fe5482djep23o1210saxecswm",
  };
};

module.exports = (app, session, con) => {
  app.post("/auth/login", (req, res) => {
    const { username, password } = req.query;
    session = req.session;

    session.username = username;
    console.log(session);

    if (username && password) {
      res.json({
        username: username,
        ...authenticate(username, password),
      });
    } else {
      res.json({
        message: "Missing input!",
      });
    }
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
    const { name, userId, username, email, password } = req.query;
    var id;
    var error;

    const query = `INSERT INTO User(Name, UserId, Username, Email, Password) 
                    VALUES('${name}', '${userId}', '${username}', '${email}', '${password}')`;

    con.query(query, (err, res) => {
      if (err) {
        console.log(err.sqlMessage);
        return;
      }
      console.log("New user is added\n", res);
      newId = res.insertId;
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
