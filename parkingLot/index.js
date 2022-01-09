const verifyRequest = require("../auth/verifyRequest");

module.exports = (app, pool) => {
  app.get(`/parkingLot`, (req, res) => {
    const ownerId = req.headers.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `
          SELECT * FROM ParkingLot WHERE OwnerId = ${ownerId}
        `;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          var json = userData.map((data) => JSON.parse(JSON.stringify(data)));
          res.json({ data: json });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.get(`/parkingLot/:id`, (req, res) => {
    const { id } = req.params;
    const ownerId = req.headers.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `
          SELECT * FROM ParkingLot WHERE OwnerId = ${ownerId} AND Id = ${id}
        `;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          var parkingLotData = userData.map((data) =>
            JSON.parse(JSON.stringify(data))
          );
          const q = `
            SELECT * FROM Membership WHERE ParkingLotId = ${id}
          `;
          pool.query(q, (err, data) => {
            if (err) {
              res.status(400).json({ message: err });
              return;
            }
            var membership = data.map((item) =>
              JSON.parse(JSON.stringify(item))
            );
            res.json({ ...parkingLotData, membership });
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });
};
