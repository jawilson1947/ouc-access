-- Create the ChurchMembers table if it doesn't exist
CREATE TABLE IF NOT EXISTS ChurchMembers (
  EmpID INT AUTO_INCREMENT PRIMARY KEY,
  lastname VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  PictureUrl VARCHAR(255),
  EmailValidationDate DATETIME,
  RequestDate DATETIME NOT NULL,
  DeviceID VARCHAR(255),
  userid VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_user_id (userid)
); 
