const express = require("express");
const app = express();

const PORT = process.env.PORT || 8080;

var mysql = require("mysql");

const createUnixSocketPool = async () => {
  const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";

  // host: "localhost",
  // user: "root",
  // password: "",
  // database: "applate",

  return new Promise((resolve, reject) => {
    const con = mysql.createPool({
      host: "localhost",
      user: "root",
      password: "",
      database: "applate",

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
  require("./db")(pool);
  require("./auth")(app, pool);
  require("./user")(app, pool);
  require("./partnership")(app, pool);
  app.listen(PORT, (req, res) => {
    console.log(`Server is running at port ${PORT}`);
  });
});
