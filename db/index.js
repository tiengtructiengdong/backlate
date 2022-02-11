const { promisify } = require("util");

module.exports = async (pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);
  //pool.query("DROP DATABASE IF EXISTS applate", function (err, res) {});
  try {
    await asyncQuery(
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
    `
    );

    /*
      Latitude DOUBLE(10,6) NOT NULL,
      Longitude DOUBLE(10,6) NOT NULL, 
    */
    await asyncQuery(
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
    `
    );
    await asyncQuery(
      `
    CREATE TABLE IF NOT EXISTS 
    Partnership(
      Id int AUTO_INCREMENT,
      PartnerId int NOT NULL,
      ParkingLotId int NOT NULL,
      IsConfirmed tinyint(1) DEFAULT 1,

      PRIMARY KEY (Id),
      FOREIGN KEY (PartnerId) REFERENCES User(Id) ON DELETE CASCADE,
      FOREIGN KEY (ParkingLotId) REFERENCES ParkingLot(Id) ON DELETE CASCADE
    );
    `
    );
    await asyncQuery(
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
    `
    );
    await asyncQuery(
      `
    CREATE TABLE IF NOT EXISTS 
    Vehicle(
      PlateId varchar(30) UNIQUE NOT NULL,
      VehicleInfo JSON,

      PRIMARY KEY (PlateId)
    );
    `
    );
    await asyncQuery(
      `
    CREATE TABLE IF NOT EXISTS 
    Customer(
      Id int AUTO_INCREMENT,
      PlateId varchar(30) NOT NULL,
      ParkingLotId int NOT NULL,
      MembershipId int NOT NULL,
      ExtraInfo JSON,

      PRIMARY KEY (Id),
      FOREIGN KEY (MembershipId) REFERENCES Membership(Id) ON DELETE CASCADE,
      FOREIGN KEY (PlateId) REFERENCES Vehicle(PlateId) ON DELETE CASCADE,
      FOREIGN KEY (ParkingLotId) REFERENCES ParkingLot(Id) ON DELETE CASCADE
    );
    `
    );
    await asyncQuery(
      `
    CREATE TABLE IF NOT EXISTS 
    Session(
      Id int AUTO_INCREMENT,
      ParkingLotId int NOT NULL,
      CustomerId int NOT NULL,
      PlateId varchar(30) NOT NULL,

      Code varchar(128) NOT NULL,
      CheckinDateTime datetime NOT NULL,
      CheckoutDateTime datetime,

      PRIMARY KEY (Id),
      FOREIGN KEY (CustomerId) REFERENCES Customer(Id) ON DELETE CASCADE,
      FOREIGN KEY (ParkingLotId) REFERENCES ParkingLot(Id) ON DELETE CASCADE
    );
    `
    );
    await asyncQuery(
      `
    CREATE VIEW IF NOT EXISTS
    ActiveSession
    AS SELECT * FROM Session WHERE CheckoutDateTime IS NULL
    `
    );
  } catch (err) {
    console.log(err);
  }
};
