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
        SELECT ParkingLot.Id, ParkingLot.Address, ParkingLot.Name, ParkingLot.SpaceCount
        FROM ParkingLot JOIN Partnership ON Partnership.ParkingLotId = ParkingLot.Id
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
        VALUES (${ownerId},'${name}','${address}',${spaceCount})`;

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
    const ownerId = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

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
        var membership = data.map((item) => JSON.parse(JSON.stringify(item)));
        res.json({ ...parkingLotData, membership });
      });
    });
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
    const { keyword } = req.params;

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
    const { id, keyword } = req.params;
    const ownerId = req.headers.id;

    const parsedKeyword = keyword.replace(".", "");

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    if (keyword.length < 4) {
      res
        .status(400)
        .json({ message: "Input should be longer than 4 characters!" });
      return;
    }

    const query = `
      SELECT * FROM Session 
      WHERE 
        ParkingLotId = ${id}
        AND REPLACE(PlateId, '.', '') LIKE '%${parsedKeyword}%'
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
