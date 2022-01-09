const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  app.post("/parkingLot/:id/addMembership", (req, res) => {
    const { name, fee, level } = req.body;
    const parkingLotId = req.params.id;
    const userId = req.headers.id;

    verifyRequest(req, pool)
      .then(async () => {
        /*`
          SELECT ParkingLot.Id, ParkingLot.OwnerId, Partnership.PartnerId
          FROM ParkingLot LEFT JOIN Partnership ON ParkingLot.Id=Partnership.ParkingLotId
          WHERE (ParkingLot.Id = ${parkingLotId} AND (
            ParkingLot.OwnerId = ${userId} OR Partnership.PartnerId = ${userId}
          ))
        `; */
        var query = `
          SELECT Id FROM ParkingLot
          WHERE Id = ${parkingLotId} AND OwnerId = ${userId} 
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

        //
        query = `
          INSERT INTO Membership (ParkingLotId, Name, Fee, Level) 
          VALUES (${parkingLotId}, '${name}', '${JSON.stringify(
          fee
        )}', ${level})
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
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden", err });
      });
  });
};
