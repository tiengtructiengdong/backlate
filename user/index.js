const authenticate = (username, password) => {
  return {
    token: "1fe5482djep23o1210saxecswm",
  };
};

module.exports = (app, session, con) => {
  app.get("/user", (req, res) => {
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
