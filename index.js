const express = require("express");
const session = require("express-session");
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
app.use(
  session({ secret: "smh9812cdmbpm", saveUninitialized: true, resave: true })
);
require("./auth")(app, session, connect);
require("./db")(connect);

app.listen(PORT, (req, res) => {
  console.log(`Server is running at port ${PORT}`);
});
