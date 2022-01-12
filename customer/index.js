module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.get("/parkingLot/:id/checkin", async (req, res) => {
    const id = req.headers.id;
    const parkingLotId = req.params.id;

    const { plateId, qrCode } = req.body;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    try {
      var query = `
        SELECT * FROM ParkingLot 
        WHERE OwnerId = ${id} AND Id = ${parkingLotId}
        LIMIT 1`;
      var data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("Not found");
      }

      query = `
        INSERT IGNORE INTO Vehicle(PlateId) VALUES('${plateId}')
      `;
      data = await asyncQuery(query);
      json = data.map((item) => JSON.parse(JSON.stringify(item)));

      var query = `
        SELECT * FROM Customer
        WHERE OwnerId = ${id} AND Id = ${parkingLotId}
        LIMIT 1`;
      var data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("Not found");
      }

      query = `
        INSERT IGNORE INTO Customer(ParkingLotId, PlateId) VALUES(${parkingLotId}, '${plateId}')
      `;
      data = await asyncQuery(query);
      json = data.map((item) => JSON.parse(JSON.stringify(item)));

      query = `
        INSERT IGNORE 
        INTO Session(ParkingLotId, CustomerId, CheckinTime, QRCode) 
        VALUES(${parkingLotId}, '${plateId}')
      `;
      data = await asyncQuery(query);
      json = data.map((item) => JSON.parse(JSON.stringify(item)));

      res.json({ message: "Successful" });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });
};
