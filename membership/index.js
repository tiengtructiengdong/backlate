const verifyRequest = require("../auth/verifyRequest");

module.exports = (app, pool) => {
  app.post("/user/addParkingLot", (req, res) => {
    const { userId, name, spaceCount, address } = req.body;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO ParkingLot (OwnerId, Name, SpaceCount, Address) VALUES (${userId}, ${name}, ${spaceCount}, ${address})`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  // WIP
  app.get(`/parkingLot/:id/getCurrentParking`, (req, res) => {
    const { name, spaceCount, address } = req.body;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO ParkingLot (Name, SpaceCount, Address) VALUES (${name}, ${spaceCount}, ${address})`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.get(`/parkingLot/:id/getParkingHistory`, (req, res) => {
    const { name, spaceCount, address } = req.body;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO ParkingLot (Name, SpaceCount, Address) VALUES (${name}, ${spaceCount}, ${address})`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.get(`/parkingLot/:id/getAllCustomers`, (req, res) => {
    const { name, spaceCount, address } = req.body;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO ParkingLot (Name, SpaceCount, Address) VALUES (${name}, ${spaceCount}, ${address})`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });
};
