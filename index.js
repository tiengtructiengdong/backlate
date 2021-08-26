const express = require("express");
const session = require("express-session");
const app = express();

var mysql = require("mysql");
var connect = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "applate",
});

app.use(
  session({ secret: "smh9812cdmbpm", saveUninitialized: true, resave: true })
);
require("./auth")(app, session, connect);
require("./db")(connect);

// Setting the server to listen at port 3000
app.listen(8000, (req, res) => {
  console.log("Server is running at port 8000");
});
