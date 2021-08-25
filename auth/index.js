const authenticate = (username, password) => {
  return {
    token: "1fe5482djep23o1210saxecswm",
  };
};

module.exports = (app, session) => {
  app.post("/auth/login", (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
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
};
