const verifyRequest = require("../auth/verifyRequest");
const EscPosEncoder = require("esc-pos-encoder");

const { v4: uuidv4 } = require("uuid");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.post("/parkingLot/:id/testCheckout", async (req, res) => {
    const userId = req.headers.id;
    const parkingLotId = req.params.id;

    const { code } = req.body;

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
        WHERE ActiveSession.Code = '${code}' 
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
        SELECT s.PlateId, m.Fee
          FROM ActiveSession AS s 
          JOIN Customer AS c ON s.CustomerId = c.Id
          JOIN Membership AS m ON c.MembershipId = m.Id
        WHERE 
          (s.ParkingLotId = ${parkingLotId} AND s.Code = '${code}')
      `;

      data = await asyncQuery(query);
      if (data.length === 0) {
        res.json({ isFound: false });
      } else {
        const { PlateId, Fee } = JSON.parse(JSON.stringify(data[0]));
        res.json({ isFound: true, plateId: PlateId, fee: Fee });
      }
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.post("/parkingLot/:id/testCheckin", async (req, res) => {
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
      res.json({ parkingLotId, plateId, customerId, code });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.post("/parkingLot/:id/checkin", async (req, res) => {
    const userId = req.headers.id;
    const parkingLotId = req.params.id;

    const { plateId, code } = req.body;

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
        SELECT * FROM Customer
        WHERE PlateId = '${plateId}' AND ParkingLotId = ${parkingLotId}`;
      const customerRaw = await asyncQuery(query);
      var customerId;

      data = JSON.parse(JSON.stringify(customerRaw[0]));
      customerId = data.Id;

      // insert into session
      query = `
        INSERT INTO Session(ParkingLotId, CustomerId, PlateId, Code, CheckinDateTime) 
        VALUES(${parkingLotId}, ${customerId}, '${plateId}', '${code}', CURRENT_TIMESTAMP())
      `;
      data = await asyncQuery(query);

      if (data.affectedRows === 0) {
        throw new Error("Error checking in");
      }

      // get checkin count
      query = `
        SELECT COUNT(Id) AS num FROM Session
        WHERE CustomerId = '${customerId}
        GROUP BY ParkingLotId
      `;
      data = await asyncQuery(query);
      const checkinCount = JSON.parse(JSON.stringify(data[0])).num;

      // search for membership
      query = `
        SELECT Id FROM Membership 
        WHERE ParkingLotId = ${id} AND SetAtCheckinCount <= ${checkinCount} AND SetAtCheckinCount <> 0
        ORDER BY SetAtCheckinCount
        LIMIT 1
      `;
      data = await asyncQuery(query);

      // upgrade membership, if there is one
      if (data.length >= 1) {
        const membershipId = JSON.parse(JSON.stringify(data[0])).Id;
        query = `
          UPDATE Customer SET MembershipId = ${membershipId}
          WHERE 
            PlateId = '${plateId}' 
            AND ParkingLotId = ${parkingLotId}
        `;
        data = await asyncQuery(query);
      }

      // return
      res.json({ message: "Successful" });
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
        UPDATE Session 
        SET CheckoutDateTime = CURRENT_TIMESTAMP(), Code = ''
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

  app.get(
    "/parkingLot/:id/customer/:plateId/getParkingFee",
    async (req, res) => {
      const userId = req.headers.id;
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
        SELECT ActiveSession.CheckinDateTime, Membership.Fee
        FROM 
          ActiveSession JOIN Customer ON ActiveSession.CustomerId = Customer.Id
          JOIN Membership ON Membership.Id = Customer.MembershipId
          JOIN ParkingLot ON Membership.ParkingLotId = ParkingLotId
        WHERE 
          Customer.PlateId = ${plateId} 
          AND ParkingLot.Id = ${parkingLotId}
      `;
        data = await asyncQuery(query);

        if (data.length === 0) {
          throw new Error("No such data");
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
    }
  );

  app.get("/parkingLot/:id/getActiveSession", async (req, res) => {
    const userId = req.headers.id;
    const parkingLotId = req.params.id;

    const { page } = req.query;

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
        SELECT ParkingLot.Id, ParkingLot.OwnerId, Partnership.PartnerId
        FROM ParkingLot LEFT JOIN Partnership ON ParkingLot.Id=Partnership.ParkingLotId
        WHERE (ParkingLot.Id = ${parkingLotId} AND (
          ParkingLot.OwnerId = ${userId} OR Partnership.PartnerId = ${userId}
        ))`;
      data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("No such parking lot");
      }

      var vehicleCount;
      if (page >= 2) {
      } else {
        query = `
          SELECT 
            COUNT(Id) AS num
          FROM 
            ActiveSession
          WHERE ParkingLotId = ${parkingLotId}
        `;
        data = await asyncQuery(query);
        vehicleCount = JSON.parse(JSON.stringify(data[0])).num;
      }

      query = `
        SELECT 
          s.Id, 
          s.CheckinDateTime,
          s.CheckoutDateTime,
          s.Code,
          s.CustomerId,
          s.PlateId,
          m.Name,
          m.Level,
          m.Fee
        FROM 
          ActiveSession AS s
          JOIN Customer AS c ON s.CustomerId = c.Id
          JOIN Membership AS m ON c.MembershipId = m.Id
        WHERE s.ParkingLotId = ${parkingLotId}
        ORDER BY s.CheckinDateTime DESC
        LIMIT 10 
        ${page >= 2 ? `OFFSET ${(page - 1) * 10}` : ""}
      `;

      data = await asyncQuery(query);
      const session = data.map((item) => JSON.parse(JSON.stringify(item)));

      res.json({ parkingLotId, session, vehicleCount });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.get("/parkingLot/:id/getHistory", async (req, res) => {
    const userId = req.headers.id;
    const parkingLotId = req.params.id;

    const { page } = req.query;

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
        SELECT * FROM Session WHERE ParkingLotId = ${parkingLotId}
      `;

      data = await asyncQuery(query);
      const session = data.map((item) => JSON.parse(JSON.stringify(item)));

      res.json({ parkingLotId, session });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.get("/parkingLot/:id/customer/:plateId/getHistory", async (req, res) => {
    const userId = req.headers.id;
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
        SELECT * 
        FROM Session 
        WHERE ParkingLotId = ${parkingLotId} AND PlateId = '${plateId}'
        LIMIT 10 
        ${page > 2 ? `OFFSET ${(page - 1) * 10}` : ""}
      `;

      data = await asyncQuery(query);
      const session = data.map((item) => JSON.parse(JSON.stringify(item)));

      res.json({ parkingLotId, plateId, session });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.put(
    "/parkingLot/:id/customer/:plateId/setMembership",
    async (req, res) => {
      const userId = req.headers.id;
      const parkingLotId = req.params.id;
      const { plateId } = req.params;

      const { membershipId } = req.body;

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
          SELECT Id
          FROM Customer
          WHERE PlateId = '${plateId}'
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
          UPDATE Customer SET MembershipId = ${membershipId}
          WHERE 
            PlateId = '${plateId}' 
            AND ParkingLotId = ${parkingLotId}
        `;

        data = await asyncQuery(query);
        if (data.affectedRows === 0) {
          throw new Error("Error setting membership");
        }

        res.json({ message: "Successful" });
      } catch (err) {
        res.status(400).json({ message: err });
        return;
      }
    }
  );
};
