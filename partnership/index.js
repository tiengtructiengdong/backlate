const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  app.post("/parkingLot/:id/addPartner", (req, res) => {
    const { partnerId } = req.body;
    const parkingLotId = req.params.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query = `INSERT INTO Partnership (PartnerId, ParkingLotId) VALUES (${partnerId}, ${parkingLotId})`;
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
  });

  app.get("/parkingLot/:id/getPartner", (req, res) => {
    const parkingLotId = req.params.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }
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
  });

  app.delete("/parkingLot/:id/deletePartner", (req, res) => {
    const { partnerId } = req.body;
    const parkingLotId = req.params.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }
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
  });
};
