const verifyRequest = require("../auth/verifyRequest");

module.exports = (app, pool) => {
  app.get("/user", (req, res) => {
    const { id } = req.query;

    verifyRequest(req, pool)
      .then(() => {
        const query = `SELECT * FROM User WHERE Id = '${id}' LIMIT 1`;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          var json = JSON.parse(JSON.stringify(userData[0]));
          res.json({
            id: json.Id,
            firstName: json.FirstName,
            lastName: json.LastName,
            phoneNumber: json.PhoneNumber,
            isVerified: json.IsVerified,
            token: json.token,
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });
};
