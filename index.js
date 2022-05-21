const express = require("express");
const app = express();

const PORT = process.env.PORT || 8080;

var mysql = require("mysql");

const createUnixSocketPool = async () => {
  const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";

  // Establish a connection to the database
  return new Promise((resolve, reject) => {
    const con = mysql.createPool({
      connectionLimit: 5,
      user: "root",
      password: `u>R#<aqngS+ZJSBh`,
      database: "applate",
      socketPath: `${dbSocketPath}/academic-empire-330510:asia-east2:backlate-server`,

      connectTimeout: 10000,
      acquireTimeout: 10000,
      waitForConnections: true,
      queueLimit: 0,
    });
    resolve(con);
  });
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

createUnixSocketPool().then((pool) => {
  //require("./db")(pool);
  require("./auth")(app, pool);
  require("./user")(app, pool);
  require("./partnership")(app, pool);
  require("./parkingLot")(app, pool);
  require("./membership")(app, pool);
  require("./customer")(app, pool);
  app.listen(PORT, (req, res) => {
    console.log(`Server is running at port ${PORT}`);
  });
});
