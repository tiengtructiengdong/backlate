const verifyRequest = require("../auth/verifyRequest");
const { promisify } = require("util");

module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.get("/user/", async (req, res) => {
    const id = req.headers.id;

    try {
      await verifyRequest(req, pool);
    } catch (err) {
      res.status(403).json({ message: "Forbidden: Not logged in" });
      return;
    }

    var userInfo;
    try {
      var query = `SELECT * FROM User WHERE Id = ${id} LIMIT 1`;
      var data = await asyncQuery(query);

      if (data.length === 0) {
        throw new Error("Not found");
      }

      var json = JSON.parse(JSON.stringify(data[0]));

      userInfo = {
        id: json.Id,
        officialId: json.OfficialId,
        fullName: json.FullName,
        phoneNumber: json.PhoneNumber,
      };

      query = `
        SELECT ParkingLot.Id, ParkingLot.Name, ParkingLot.Address, ParkingLot.SpaceCount
        FROM Partnership INNER JOIN ParkingLot ON Partnership.ParkingLotId = ParkingLot.Id
        WHERE Partnership.PartnerId = ${id}
      `;
      data = await asyncQuery(query);

      json = data.map((item) => JSON.parse(JSON.stringify(item)));

      userInfo = {
        ...userInfo,
        workingParkingLot: json,
      };

      query = `SELECT * FROM ParkingLot WHERE OwnerId = ${id}`;
      data = await asyncQuery(query);

      json = data.map((item) => JSON.parse(JSON.stringify(item)));

      userInfo = {
        ...userInfo,
        owningParkingLot: json,
      };

      res.json(userInfo);
    } catch (err) {
      res.status(400).json({ message: err });
      return;
    }
  });
};
