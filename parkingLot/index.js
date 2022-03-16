const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.get(`/parkingLot`, async (req, res) => {
    const ownerId = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    try {
      var query = `
        SELECT * FROM ParkingLot WHERE OwnerId = ${ownerId}
      `;
      var userData = await asyncQuery(query);
      const myParkingLot = userData.map((data) =>
        JSON.parse(JSON.stringify(data))
      );

      query = `
        SELECT parkingLot?.Id, ParkingLot.Address, ParkingLot.Name, ParkingLot.SpaceCount
        FROM ParkingLot JOIN Partnership ON Partnership.ParkingLotId = parkingLot?.Id
        WHERE Partnership.PartnerId = ${ownerId}
      `;
      userData = await asyncQuery(query);
      const workingParkingLot = userData.map((data) =>
        JSON.parse(JSON.stringify(data))
      );

      res.json({ myParkingLot, workingParkingLot });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  });

  app.post("/parkingLot/addParkingLot", async (req, res) => {
    const { address, name, spaceCount, defaultFee } = req.body;
    const ownerId = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    try {
      var query = `
        INSERT INTO ParkingLot (OwnerId, Name, Address, SpaceCount) 
        VALUES (${ownerId},'${name}','${address}',${spaceCount || 0})`;

      var data = await asyncQuery(query);
      const parkingLotId = data.insertId;

      query = `
        INSERT INTO Membership (ParkingLotId, Name, Fee, Level) 
        VALUES (${parkingLotId}, 'Default', '${JSON.stringify(
        defaultFee
      )}', 0)`;

      await asyncQuery(query);

      res.json({
        message: "Successful",
        id: data.insertId,
      });
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });

  app.get(`/parkingLot/:id`, async (req, res) => {
    const { id } = req.params;
    const userId = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    try {
      var query = `
        SELECT 
          parkingLot?.Id, 
          ParkingLot.OwnerId, 
          ParkingLot.Address, 
          ParkingLot.Name, 
          ParkingLot.SpaceCount
        FROM ParkingLot LEFT JOIN Partnership ON Partnership.ParkingLotId = parkingLot?.Id
        WHERE 
          (ParkingLot.OwnerId = ${userId} OR Partnership.PartnerId = ${userId})
          AND parkingLot?.Id = ${id}
      `;
      var response = await asyncQuery(query);

      console.log("userId", userId, "parkingLotId", id, response);

      if (response.length === 0) {
        throw new Error("No records");
      }

      var parkingLot = JSON.parse(JSON.stringify(response[0]));

      query = `
        SELECT * FROM Membership WHERE ParkingLotId = ${id}
      `;
      response = await asyncQuery(query);

      var membership = response.map((item) => JSON.parse(JSON.stringify(item)));
      res.json({ parkingLot, membership });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  });

  // cannot set headers?
  app.put(`/parkingLot/:id/update`, async (req, res) => {
    const { address, name, spaceCount } = req.body;
    const ownerId = req.headers.id;
    const parkingLotId = req.params.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query = `
      SELECT Id FROM ParkingLot
      WHERE Id = ${parkingLotId} AND OwnerId = ${ownerId} 
    `;
    const asyncQuery = promisify(pool.query).bind(pool);

    try {
      const exe = await asyncQuery(query);
      console.log(exe);
      if (exe.length === 0) {
        res.status(403).json({
          message:
            "Forbidden: You do not have permission with this parking lot.",
        });
        return;
      }
    } catch (err) {
      res.status(400).json({ message: "Error" });
      return;
    }

    query = `
      UPDATE ParkingLot 
      SET 
        ${address ? `Address = '${address}' ,` : ""} 
        ${name ? `Name = '${name}' ,` : ""} 
        ${spaceCount ? `SpaceCount = '${spaceCount}'` : ""}
      WHERE OwnerId = ${ownerId} AND Id = ${parkingLotId}
    `;
    pool.query(query, (err, data) => {
      if (err) {
        res.status(400).json({ message: err });
        return;
      }
    });

    res.json({
      message: "Successful",
    });
  });

  app.get(`/searchUser`, async (req, res) => {
    const { keyword } = req.query;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    const query = `
      SELECT Id, PhoneNumber, FullName FROM User 
      WHERE 
        OfficialId = '${keyword}' 
        OR FullName LIKE '${keyword}%'
        OR FullName LIKE '% ${keyword}%'
        OR PhoneNumber = '${keyword}'
      LIMIT 10;
    `;
    pool.query(query, (err, data) => {
      if (err) {
        res.status(400).json({ message: err });
        return;
      }
      var users = data.map((item) => JSON.parse(JSON.stringify(item)));
      res.json({ users });
    });
  });

  app.get(`/parkingLot/:id/searchVehicle`, async (req, res) => {
    const { id } = req.params;
    const { keyword } = req.query;
    const ownerId = req.headers.id;

    if (keyword === undefined || keyword === null || keyword.length < 4) {
      res
        .status(400)
        .json({ message: "Input should be longer than 4 characters!" });
      return;
    }

    const parsedKeyword = keyword.replace(".", "");

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    const query = `
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
      WHERE 
        s.ParkingLotId = ${id}
        AND REPLACE(s.PlateId, '.', '') LIKE '%${parsedKeyword}%'
      LIMIT 10
    `;
    try {
      var data = await asyncQuery(query);
      const vehicles = data.map((item) => JSON.parse(JSON.stringify(item)));
      res.json({ vehicles });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  });
};
