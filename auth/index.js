module.exports = app => {

  app.get('/auth', (req, res) => {
    const username = req.query.username;
    const password = req.query.password;

    res.json({
      username: username,
      password: password
    });
  });
}