module.exports = (pool) => {
  pool.query("DROP TABLE User", function (err, res) {});
  pool.query("DROP TABLE ParkingLot", function (err, res) {});
  pool.query("DROP TABLE ParkingLotPartner", function (err, res) {});
  pool.query("DROP TABLE Fee", function (err, res) {});
  pool.query("DROP TABLE Membership", function (err, res) {});
  pool.query("DROP TABLE Vehicle", function (err, res) {});
  pool.query("DROP TABLE VehicleOwn", function (err, res) {});

  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      User(
        Id varchar(12) UNIQUE NOT NULL,
        FirstName varchar(255) NOT NULL,
        LastName varchar(255) NOT NULL,
        PhoneNumber varchar(255) UNIQUE NOT NULL,
        Password varchar(255) NOT NULL,
        UserToken varchar(255),
        IsVerified tinyint(1) DEFAULT 0,

        PRIMARY KEY (Id)
      ); 
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table User successfully\n", res);
    }
  );
  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      ParkingLot(
        Id int AUTO_INCREMENT,
        OwnerId varchar(12) NOT NULL,
        Name varchar(255) NOT NULL,
        Address varchar(255),
        SpaceCount int(16) DEFAULT 0,

        PRIMARY KEY (Id),
        FOREIGN KEY (OwnerId) REFERENCES User(Id) ON DELETE CASCADE
      );
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table ParkingLot successfully\n", res);
    }
  );
  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      ParkingLotPartner(
        Id int AUTO_INCREMENT,
        PartnerId varchar(12) NOT NULL,
        ParkingLotId int NOT NULL,

        PRIMARY KEY (Id),
        FOREIGN KEY (PartnerId) REFERENCES User(Id) ON DELETE CASCADE,
        FOREIGN KEY (ParkingLotId) REFERENCES ParkingLot(Id) ON DELETE CASCADE
      );
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table ParkingLotPartner successfully\n", res);
    }
  );
  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      Fee(
        Id int AUTO_INCREMENT,
        ParkingLotId int NOT NULL,
        FromTime TIME NOT NULL,
        ToTime TIME NOT NULL,
        FromDay int(1) NOT NULL,
        ToDay int(1) NOT NULL,
        BikeFee int(8) NOT NULL,
        CarFee int(8) NOT NULL, 

        PRIMARY KEY (Id),
        FOREIGN KEY (ParkingLotId) REFERENCES ParkingLot(Id) ON DELETE CASCADE
      );
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table Fee successfully\n", res);
    }
  );
  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      Membership(
        Id int AUTO_INCREMENT,
        ParkingLotId int NOT NULL,
        Name varchar(255) NOT NULL,
        CheckinFrequency int NOT NULL,
        Discount double NOT NULL,

        PRIMARY KEY (Id),
        FOREIGN KEY (ParkingLotId) REFERENCES ParkingLot(Id) ON DELETE CASCADE
      );
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table Membership successfully\n", res);
    }
  );
  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      Vehicle(
        Id int AUTO_INCREMENT,
        PlateId varchar(15) NOT NULL UNIQUE,
        Name varchar(255),
        Color varchar(25),
        Type varchar(25) NOT NULL,
        IsVerified tinyint(1) NOT NULL,
        CurrentQR varchar(255),

        PRIMARY KEY (Id)
      );
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table Vehicle successfully\n", res);
    }
  );
  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      VehicleOwn(
        Id int AUTO_INCREMENT,
        UserId varchar(12) NOT NULL,
        VehicleId int NOT NULL,

        PRIMARY KEY (Id),
        FOREIGN KEY (UserId) REFERENCES User(Id) ON DELETE CASCADE,
        FOREIGN KEY (VehicleId) REFERENCES Vehicle(Id) ON DELETE CASCADE
      );
      `,
    (err, res) => {
      if (err) {
        throw err;
        return;
      }
      console.log("Create table VehicleOwn successfully\n", res);
    }
  );
};
