-- Create the ChurchMembers table if it doesn't exist
CREATE TABLE IF NOT EXISTS ChurchMembers (
  EmpID INT AUTO_INCREMENT PRIMARY KEY,
  lastname VARCHAR(255) NOT NULL,
  firstname VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  Picture_Url VARCHAR(255),
  email_validation_date DATETIME,
  request_date DATETIME NOT NULL,
  device_id VARCHAR(255),
  user_id VARCHAR(255),
  gmail VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_user_id (user_id)
); 