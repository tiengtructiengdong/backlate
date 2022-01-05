const verifyRequest = require("../auth/verifyRequest");

module.exports = (app, pool) => {
  app.get("/parkingLot/getPartner", (req, res) => {
    const { parkingLotId } = req.query;

    verifyRequest(req, pool)
      .then(() => {
        const query = `SELECT * FROM Partnership WHERE ParkingLotId = '${parkingLotId}'`;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          var json = userData.map((data) => JSON.parse(JSON.stringify(data)));
          res.json(json);
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.post("/parkingLot/addPartner", (req, res) => {
    const { parkingLotId, userId } = req.body;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO Partnership (ParkingLotId, UserId) VALUES (parkingLotId, userId)`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
            parkingLotId: parkingLotId,
            userId: userId,
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.post("/parkingLot/deletePartner", (req, res) => {
    const { parkingLotId, userId } = req.body;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO Partnership (ParkingLotId, UserId) VALUES (parkingLotId, userId)`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
            parkingLotId: parkingLotId,
            userId: userId,
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.get("/user/getWorkingParkingLot", (req, res) => {
    const { userId } = req.query;

    verifyRequest(req, pool)
      .then(() => {
        const query = `SELECT * FROM Partnership WHERE UserId = '${userId}'`;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          var json = userData.map((data) => JSON.parse(JSON.stringify(data)));
          res.json(json);
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.post("/parkingLot/addParkingLot", (req, res) => {
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
