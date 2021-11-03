const { promisify } = require("util");

const verifyToken = async (pool, token, id) => {
  const query = `SELECT * FROM User WHERE Id = '${id}' AND UserToken = '${token}'`;
  const asyncQuery = promisify(pool.query).bind(pool);

  try {
    const res = await asyncQuery(query);
    if (res.length === 0) {
      throw new Error();
    }
  } catch (err) {
    throw new Error("Forbidden");
  }
};

module.exports = verifyToken;
