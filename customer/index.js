const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.get("/parkingLot/:id/checkin", async (req, res) => {
    const id = req.headers.id;
    const parkingLotId = req.params.id;

    const { plateId } = req.body;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    try {
      var query = `
        SELECT Customer.PlateId
        FROM ActiveSession JOIN Customer ON ActiveSession.CustomerId = Customer.Id
        WHERE Customer.PlateId = ${plateId}`;
      var data = await asyncQuery(query);

      if (data.length > 0) {
        throw new Error("Vehicle is under session");
      }

      query = `
        SELECT * FROM ParkingLot 
        WHERE OwnerId = ${id} AND Id = ${parkingLotId}
        LIMIT 1`;
      var data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("No such parking lot");
      }

      query = `
        INSERT IGNORE INTO Vehicle(PlateId) VALUES('${plateId}')
      `;
      await asyncQuery(query);

      query = `
        SELECT * FROM Customer
        WHERE OwnerId = ${id} AND Id = ${parkingLotId}
        LIMIT 1`;
      const customerRaw = await asyncQuery(query);
      var customerId;

      if (customerRaw.length === 0) {
        query = `
          INSERT INTO Customer(ParkingLotId, PlateId) VALUES(${parkingLotId}, '${plateId}')
        `;
        const data = await asyncQuery(query);
        customerId = data.insertId;
      } else {
        const data = JSON.parse(JSON.stringify(customerRaw[0]));
        customerId = data.insertId;
      }

      const code = uuidv4();

      query = `
        INSERT INTO Session(ParkingLotId, CustomerId, PlateId, Code, CheckinTime) 
        VALUES(${parkingLotId}, ${customerId}, '${plateId}', '${code}', CURRENT_TIMESTAMP())
      `;
      await asyncQuery(query);
      res.json({ parkingLotId, plateId, customerId, code });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });
};
