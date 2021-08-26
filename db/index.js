module.exports = (con) => {
  con.connect((err) => {
    if (err) throw err;
    console.log("Connected!");

    con.query("CREATE DATABASE applate", (err, res) => {
      if (err) {
        console.log("Database exists!");
        return;
      }
      console.log("Create database successfully\n", res);
    });

    //con.query("DROP TABLE User", function (err, result) {});

    con.query(
      `CREATE TABLE User(
        Id int NOT NULL AUTO_INCREMENT,
        Name varchar(256) NOT NULL,
        UserId varchar(12) UNIQUE,
        Username varchar(16) NOT NULL UNIQUE,
        Email varchar(256) UNIQUE,
        Password varchar(256) NOT NULL,
        PRIMARY KEY (Id)
      )`,
      (err, res) => {
        if (err) {
          console.log("Table User exists!");
          return;
        }
        console.log("Create table User successfully\n", res);
      }
    );
  });
};
