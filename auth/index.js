const authenticate = (username, password) => {
  return {
    token: "1fe5482djep23o1210saxecswm",
  };
};

module.exports = (app) => {
  app.get("/auth", (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    if (username && password) {
      res.json({
        status: 200,
        username: username,
        ...authenticate(username, password)
      });
    } else {
      res.json({
        status: 400,
        message: "Missing input!",
      });
    }
  });
};
