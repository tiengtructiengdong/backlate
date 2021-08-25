const express = require("express");
const session = require("express-session");
const app = express();

app.use(session({ secret: "ssshhhhh", saveUninitialized: true, resave: true }));

app.get("/", (req, res) => {
  res.json({
    number: 1,
  });
});

require("./auth")(app, session);

app.get("/array", (req, res) => {
  res.json([
    {
      number: 1,
      name: "John",
      gender: "male",
    },
    {
      number: 2,
      name: "Ashley",
      gender: "female",
    },
  ]);
});

// Setting the server to listen at port 3000
app.listen(8000, (req, res) => {
  console.log("Server is running at port 8000");
});
