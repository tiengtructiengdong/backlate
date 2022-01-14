const verifyRequest = require("../auth/verifyRequest");

const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.post("/parkingLot/:id/checkin", async (req, res) => {
    const userId = req.headers.id;
    const parkingLotId = req.params.id;

    const { plateId } = req.body;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query;
    var data;

    try {
      query = `
        SELECT Customer.PlateId
        FROM ActiveSession JOIN Customer ON ActiveSession.CustomerId = Customer.Id
        WHERE Customer.PlateId = '${plateId}'`;
      data = await asyncQuery(query);

      if (data.length > 0) {
        throw new Error("Vehicle is under session");
      }

      query = `
        SELECT ParkingLot.Id, ParkingLot.OwnerId, Partnership.PartnerId
        FROM ParkingLot LEFT JOIN Partnership ON ParkingLot.Id=Partnership.ParkingLotId
        WHERE (ParkingLot.Id = ${parkingLotId} AND (
          ParkingLot.OwnerId = ${userId} OR Partnership.PartnerId = ${userId}
        ))
      `;
      data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("No such parking lot");
      }

      query = `
        INSERT IGNORE INTO Vehicle(PlateId) VALUES('${plateId}')
      `;
      await asyncQuery(query);

      query = `
        SELECT * FROM Customer
        WHERE PlateId = '${plateId}' AND ParkingLotId = ${parkingLotId}`;
      const customerRaw = await asyncQuery(query);
      var customerId;

      // which MembershipId?
      if (customerRaw.length === 0) {
        // get Level-0 Membership Id
        query = `
          SELECT * FROM Membership
          WHERE Level = 0 AND ParkingLotId = ${parkingLotId}`;
        const membershipRaw = await asyncQuery(query);
        data = JSON.parse(JSON.stringify(membershipRaw[0]));
        const membershipId = data.Id;
        query = `
          INSERT INTO Customer(ParkingLotId, PlateId, MembershipId) VALUES(${parkingLotId}, '${plateId}', ${membershipId})
        `;
        data = await asyncQuery(query);
        customerId = data.insertId;
      } else {
        data = JSON.parse(JSON.stringify(customerRaw[0]));
        customerId = data.Id;
      }

      const code = uuidv4();

      query = `
        INSERT INTO Session(ParkingLotId, CustomerId, PlateId, Code, CheckinDateTime) 
        VALUES(${parkingLotId}, ${customerId}, '${plateId}', '${code}', CURRENT_TIMESTAMP())
      `;
      data = await asyncQuery(query);

      if (data.affectedRows === 0) {
        throw new Error("Error checking in");
      }

      res.json({ parkingLotId, plateId, customerId, code });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.post("/parkingLot/:id/checkout", async (req, res) => {
    const userId = req.headers.id;
    const parkingLotId = req.params.id;

    const { plateId } = req.body;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query;
    var data;

    try {
      query = `
        SELECT Customer.Id
        FROM ActiveSession JOIN Customer ON ActiveSession.CustomerId = Customer.Id
        WHERE Customer.PlateId = '${plateId}'
      `;
      data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("Vehicle is checked out!");
      }

      query = `
        SELECT ParkingLot.Id, ParkingLot.OwnerId, Partnership.PartnerId
        FROM ParkingLot LEFT JOIN Partnership ON ParkingLot.Id=Partnership.ParkingLotId
        WHERE (ParkingLot.Id = ${parkingLotId} AND (
          ParkingLot.OwnerId = ${userId} OR Partnership.PartnerId = ${userId}
        ))`;
      data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("No such parking lot");
      }

      query = `
        UPDATE Session SET CheckoutDateTime = CURRENT_TIMESTAMP()
        WHERE (PlateId = '${plateId}' AND CheckoutDateTime IS NULL)
      `;

      data = await asyncQuery(query);
      if (data.affectedRows === 0) {
        throw new Error("Error checking out");
      }

      res.json({ message: "Checkout successful", plateId });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.get("/parkingLot/:id/getParkingFee", async (req, res) => {
    const id = req.headers.id;
    const parkingLotId = req.params.id;

    const { plateId } = req.params;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query;
    var data;

    try {
      query = `
        SELECT ActiveSession.CheckinDateTime, Membership.Fee
        FROM 
          ActiveSession JOIN Customer ON ActiveSession.CustomerId = Customer.Id
          JOIN Membership ON Membership.Id = Customer.MembershipId
        WHERE Customer.PlateId = ${plateId}
      `;
      data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("Vehicle is checked out!");
      }

      const raw = JSON.parse(JSON.stringify(data[0]));

      // Calculate the price

      var startTime = new Date(raw.CheckinDateTime);
      const current = new Date();

      const fee = raw.Fee;

      if (fee === undefined) {
        throw new Error("Price not defined!");
      }

      if (fee.price.length === 1 && fee.frequency === "fixed") {
        res.json({ fee: fee[0].price });
        return;
      }

      var totalFee = 0;

      while (startTime < current) {
        for (const subFee of fee.price) {
          const toTime = new Date(subFee.toTime);
          const endTime = min(toTime, current);

          const period = endTime.getTime() - startTime.getTime();
          if (fee.frequency === "hourly") {
            const hour = 1000 * 60 * 60;
            total += (subFee.price * period) / hour;
          } else if (fee.frequency === "daily") {
            const day = 1000 * 60 * 24;
            total += (subFee.price * period) / day;
          }

          startTime = endTime;
          if (startTime >= current) {
            break;
          }
        }
      }

      res.json({ totalFee });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });
};
