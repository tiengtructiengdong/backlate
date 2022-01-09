const verifyRequest = require("../auth/verifyRequest");

module.exports = (app, pool) => {
  app.post("/parkingLot/:id/addPartner", (req, res) => {
    const { partnerId } = req.body;
    const parkingLotId = req.params.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO Partnership (PartnerId, ParkingLotId) VALUES (${partnerId}, ${parkingLotId})`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
            partnerId,
            parkingLotId,
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.get("/parkingLot/:id/getPartner", (req, res) => {
    const parkingLotId = req.params.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `
          SELECT 
            User.Id, 
            User.OfficialId, 
            User.FullName, 
            User.PhoneNumber
          FROM Partnership INNER JOIN User ON User.Id=Partnership.PartnerId
          WHERE Partnership.ParkingLotId = '${parkingLotId}' 
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

  app.delete("/parkingLot/:id/deletePartner", (req, res) => {
    const { partnerId } = req.body;
    const parkingLotId = req.params.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `DELETE FROM Partnership WHERE ParkingLotId = '${parkingLotId}' AND PartnerId = '${partnerId}' `;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Deleted",
            partnerId,
            parkingLotId,
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });
};