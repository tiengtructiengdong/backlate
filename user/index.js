const verifyToken = require("../auth/verifyToken");

module.exports = (app, pool) => {
  app.get("/user", async (req, res) => {
    const { searchId, requestId } = req.query;
    const bearerHeader = req.headers["authorization"];

    if (bearerHeader) {
      const bearer = bearerHeader.split(" ");
      const bearerToken = bearer[1];
      req.token = bearerToken;
    } else {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    await verifyToken(pool, req.token, requestId)
      .then(() => {
        const query = `SELECT * FROM User WHERE Id = '${searchId}' LIMIT 1`;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({
              message: err,
            });
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
