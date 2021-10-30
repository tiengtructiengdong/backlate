module.exports = (pool) => {
  pool.query(
    `CREATE TABLE IF NOT EXISTS User(
        Id int NOT NULL AUTO_INCREMENT,
        Name varchar(256) NOT NULL,
        UserId varchar(12) UNIQUE,
        Username varchar(16) NOT NULL UNIQUE,
        PhoneNumber varchar(256) UNIQUE,
        Password varchar(256) NOT NULL,
        UserToken varchar(256),
        PRIMARY KEY (Id)
      )`,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table User successfully\n", res);
    }
  );
};
