module.exports = (mysql) => {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "applate",
  });

  con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");

    //con.query("DROP DATABASE applate", function (err, result) {});

    con.query("CREATE DATABASE applate", (err, result) => {
      if (err) {
        console.log("Database exists!");
        return;
      }
      console.log("Create database successful");
    });

    con.query(
      `CREATE TABLE User(
        PersonID int,
        LastName varchar(255),
        FirstName varchar(255),
        Address varchar(255),
        City varchar(255) 
      )`,
      (err, res) => {
        if (err) {
          throw err;
        }
        console.log(res);
      }
    );
  });
};
