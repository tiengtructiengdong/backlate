module.exports = (pool) => {
  //pool.query("DROP DATABASE IF EXISTS applate", function (err, res) {});

  pool.query(
    `
      CREATE TABLE IF NOT EXISTS 
      User(
        Id int AUTO_INCREMENT,
        OfficialId varchar(12) UNIQUE NOT NULL,
        FullName varchar(255) NOT NULL,
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
        OwnerId int NOT NULL,
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
      Partnership(
        Id int AUTO_INCREMENT,
        PartnerId int NOT NULL,
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
      Membership(
        Id int AUTO_INCREMENT,
        ParkingLotId int NOT NULL,
        
        Name varchar(50) NOT NULL,
        Fee JSON NOT NULL,
        Level int NOT NULL,
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
      Vehicle(
        PlateId int AUTO_INCREMENT,
        VehicleInfo JSON NOT NULL,

        PRIMARY KEY (PlateId)
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
};
