const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  app.post("/parkingLot/:id/addMembership", async (req, res) => {
    const { name, fee, level, setAtCheckinCount } = req.body;
    const parkingLotId = req.params.id;
    const userId = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query = `
      SELECT Id FROM ParkingLot
      WHERE Id = ${parkingLotId} AND OwnerId = ${userId} 
    `;
    const asyncQuery = promisify(pool.query).bind(pool);

    try {
      const exe = await asyncQuery(query);
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

    //
    query = `
      INSERT INTO Membership (ParkingLotId, Name, Fee, Level, SetAtCheckinCount) 
      VALUES (${parkingLotId}, '${name}', '${JSON.stringify(fee)}', ${level}, ${
      setAtCheckinCount || 0
    })
    `;
    pool.query(query, (err, data) => {
      if (err) {
        res.status(400).json({ message: err });
        return;
      }
      res.json({
        message: "Successful",
        parkingLotId,
        name,
        fee,
        level,
      });
    });
  });

  app.delete("/parkingLot/:id/deleteMembership", async (req, res) => {
    const { membershipId } = req.body;
    const parkingLotId = req.params.id;
    const userId = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var query = `
      SELECT Id FROM ParkingLot
      WHERE Id = ${parkingLotId} AND OwnerId = ${userId} 
    `;
    const asyncQuery = promisify(pool.query).bind(pool);

    try {
      const exe = await asyncQuery(query);
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

    //
    query = `
      DELETE FROM Membership WHERE Id = ${membershipId}
    `;
    pool.query(query, (err, data) => {
      if (err) {
        res.status(400).json({ message: err });
        return;
      }
      res.json({
        message: "Successful",
      });
    });
  });

  app.put(
    "/parkingLot/:id/membership/:membershipId/updateMembership",
    async (req, res) => {
      const { name, fee, level } = req.body;
      const { membershipId } = req.params;
      const parkingLotId = req.params.id;
      const userId = req.headers.id;

      try {
        await verifyRequest(req, pool);
      } catch (err) {
        res.status(403).json({ message: "Forbidden: Not logged in" });
        return;
      }

      var query = `
        SELECT Id FROM ParkingLot
        WHERE Id = ${parkingLotId} AND OwnerId = ${userId} 
      `;
      const asyncQuery = promisify(pool.query).bind(pool);

      try {
        const exe = await asyncQuery(query);
        if (exe.length === 0) {
          res.status(403).json({
            message:
              "Forbidden: You do not have permission with this parking lot.",
          });
          return;
        }
      } catch (err) {
        res.status(400).json({ message: "Error", err });
        return;
      }

      query = `
        UPDATE Membership
        SET 
          ${
            fee
              ? `Fee = '${JSON.stringify(fee)}' ${name || level ? "," : ""}`
              : ""
          } 
          ${name ? `Name = '${name}' ${level ? "," : ""}` : ""} 
          ${level ? `Level = '${level}'` : ""}
        WHERE (ParkingLotId = ${parkingLotId} AND Id = ${membershipId})
      `;

      try {
        const exe = await asyncQuery(query);
        if (exe.affectedRows > 0) {
          res.json({
            message: "Successful",
          });
        } else {
          res.status(404).json({
            message: "Not found",
          });
        }
        return;
      } catch (err) {
        res.status(400).json({ message: "Error", err });
        return;
      }
    }
  );
};
