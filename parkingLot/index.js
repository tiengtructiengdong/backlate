const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  app.get(`/parkingLot`, (req, res) => {
    const ownerId = req.headers.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `
          SELECT * FROM ParkingLot WHERE OwnerId = ${ownerId}
        `;
        pool.query(query, (err, userData) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          var json = userData.map((data) => JSON.parse(JSON.stringify(data)));
          res.json({ data: json });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.post("/parkingLot/addParkingLot", (req, res) => {
    const { address, name, spaceCount } = req.body;
    const ownerId = req.headers.id;

    verifyRequest(req, pool)
      .then(() => {
        const query = `INSERT INTO ParkingLot (OwnerId, Name, Address, SpaceCount) VALUES (${ownerId},'${name}','${address}',${spaceCount})`;
        pool.query(query, (err, data) => {
          if (err) {
            res.status(400).json({ message: err });
            return;
          }
          res.json({
            message: "Successful",
            id: data.insertId,
          });
        });
      })
      .catch((err) => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  app.get(`/parkingLot/:id`, (req, res) => {
    const { id } = req.params;
    const ownerId = req.headers.id;

    verifyRequest(req, pool)
      .then(() => {
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
            var membership = data.map((item) =>
              JSON.parse(JSON.stringify(item))
            );
            res.json({ ...parkingLotData, membership });
          });
        });
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });

  // cannot set headers?
  app.put(`/parkingLot/:id/update`, (req, res) => {
    const { address, name, spaceCount } = req.body;
    const ownerId = req.headers.id;
    const parkingLotId = req.params.id;

    verifyRequest(req, pool)
      .then(async () => {
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
      })
      .catch(() => {
        res.status(403).json({ message: "Forbidden" });
      });
  });
};
