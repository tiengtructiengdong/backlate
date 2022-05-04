const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

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
      const { name, fee, level, setAtCheckinCount } = req.body;
      const { membershipId } = req.params;
      const parkingLotId = req.params.id;
      const userId = req.headers.id;

      try {
        await verifyRequest(req, pool);
      } catch (err) {
        res.status(403).json({ message: "Forbidden: Not logged in" });
        return;
      }

      try {
        var query = `
          SELECT Id FROM ParkingLot
          WHERE Id = ${parkingLotId} AND OwnerId = ${userId} 
        `;
        var data = await asyncQuery(query);
        if (data.length === 0) {
          res.status(403).json({
            message:
              "Forbidden: You do not have permission with this parking lot.",
          });
          return;
        }

        if (setAtCheckinCount > 0) {
          query = `
            SELECT Id FROM Membership
            WHERE ParkingLotId = ${parkingLotId} AND SetAtCheckinCount = ${setAtCheckinCount}
          `;
          data = await asyncQuery(query);
          if (data.length > 1) {
            throw new Error("Please input a different checkin count.");
          }
        }

        query = `
          UPDATE Membership
          SET 
            ${
              fee
                ? `Fee = '${JSON.stringify(fee)}' ${
                    name || level || setAtCheckinCount ? "," : ""
                  }`
                : ""
            } 
            ${
              name
                ? `Name = '${name}' ${level || setAtCheckinCount ? "," : ""}`
                : ""
            } 
            ${
              level ? `Level = '${level}' ${setAtCheckinCount ? "," : ""}` : ""
            } 
            ${
              setAtCheckinCount
                ? `SetAtCheckinCount = '${setAtCheckinCount}'`
                : ""
            } 
          WHERE (ParkingLotId = ${parkingLotId} AND Id = ${membershipId})
        `;

        data = await asyncQuery(query);
        if (data.affectedRows > 0) {
          res.json({
            message: "Successful",
          });
        } else {
          res.status(404).json({
            message: "Not found",
          });
        }
      } catch (err) {
        res.status(400).json({ message: "Error", err });
      }
    }
  );
};
