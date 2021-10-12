const express = require("express");
const app = express();

const PORT = 8000;

var mysql = require("mysql");
var connect = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "applate",
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require("./auth")(app, connect);
require("./db")(connect);

app.listen(PORT, (req, res) => {
  console.log(`Server is running at port ${PORT}`);
});
