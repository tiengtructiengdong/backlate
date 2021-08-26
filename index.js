const express = require("express");
const session = require("express-session");
const app = express();

var mysql = require("mysql");

app.use(
  session({ secret: "smh9812cdmbpm", saveUninitialized: true, resave: true })
);
require("./auth")(app, session, mysql);
require("./db")(mysql);

// Setting the server to listen at port 3000
app.listen(8000, (req, res) => {
  console.log("Server is running at port 8000");
});
