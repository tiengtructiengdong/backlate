const { promisify } = require("util");

const verifyRequest = async (req, pool) => {
  const bearerHeader = req.headers["authorization"];
  const id = req.headers["id"];
  var token = "";

  if (id) {
  } else {
    throw new Error();
  }

  if (bearerHeader) {
    const bearerToken = bearerHeader.split(" ")[1];
    token = bearerToken;
  } else {
    throw new Error();
  }

  const query = `SELECT * FROM User WHERE Id = '${id}' AND UserToken = '${token}'`;
  const asyncQuery = promisify(pool.query).bind(pool);

  try {
    const res = await asyncQuery(query);
    if (res.length === 0) {
      throw new Error();
    }
  } catch (err) {
    throw new Error();
  }
};

module.exports = verifyRequest;
