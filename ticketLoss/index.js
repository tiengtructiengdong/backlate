const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.post(
    "/parkingLot/:id/customer/:plateId/reportTicketLoss",
    async (req, res) => {
      const { sessionId, sessionData, isResolved } = req.body;
      const plateId = req.params.plateId;
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
      var data = await asyncQuery(query);
      if (data.length === 0) {
        res.status(403).json({
          message:
            "Forbidden: You do not have permission with this parking lot.",
        });
        return;
      }

      try {
        query = `
          SELECT s.Id 
          FROM 
            Session AS s
            JOIN Customer AS c ON c.Id = s.CustomerId
          WHERE s.Id = ${sessionId} AND s.ParkingLotId = ${parkingLotId} AND c.PlateId = '${plateId}'
        `;
        data = await asyncQuery(query);
        if (data.length == 0) {
          throw new Error("Invalid session id");
        }

        query = `
          UPDATE Session 
          SET LostTicket = 1
          WHERE Id = ${sessionId}
        `;
        data = await asyncQuery(query);
        query = `
          INSERT INTO LossIssue (SessionId, VehicleId, Data, IsResolved) 
          VALUES (${sessionId}, ${plateId}, '${JSON.stringify(sessionData)}', ${
          isResolved ? 1 : 0
        })
        `;

        data = await asyncQuery(query);
        if (isResolved) {
          query = `
            UPDATE Session 
            SET CheckoutDateTime = CURRENT_TIMESTAMP(), Code = ''
            WHERE (PlateId = '${plateId}' AND CheckoutDateTime IS NULL)
          `;
          data = await asyncQuery(query);
        }

        res.json({
          message: "Ticket loss is reported",
          isResolved,
        });
      } catch (err) {
        res.status(400).json({ message: err.message });
        return;
      }

      //
    }
  );

  app.post(
    "/parkingLot/:id/customer/:plateId/resolveTicketLoss",
    async (req, res) => {
      const { sessionId } = req.body;
      const plateId = req.params.plateId;
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
      var data = await asyncQuery(query);
      if (data.length === 0) {
        res.status(403).json({
          message:
            "Forbidden: You do not have permission with this parking lot.",
        });
        return;
      }

      try {
        query = `
          SELECT l.Id
          FROM 
            LossIssue AS l
            JOIN Session AS s
            JOIN Customer AS c ON c.Id = s.CustomerId
          WHERE s.Id = ${sessionId} AND s.ParkingLotId = ${parkingLotId} AND c.PlateId = '${plateId}'
        `;
        data = await asyncQuery(query);
        if (data.length == 0) {
          throw new Error("Invalid loss data!");
        }
        const lossIssueId = JSON.parse(JSON.stringify(data[0])).Id;

        query = `
          UPDATE LossIssue SET IsResolved = 1 
          WHERE Id = ${lossIssueId}
        `;
        data = await asyncQuery(query);
        query = `
          UPDATE Session 
          SET CheckoutDateTime = CURRENT_TIMESTAMP(), Code = ''
          WHERE (PlateId = '${plateId}' AND CheckoutDateTime IS NULL)
        `;
        data = await asyncQuery(query);

        res.json({
          message: "Resolved!",
        });
      } catch (err) {
        res.status(400).json({ message: err.message });
        return;
      }

      //
    }
  );
};
