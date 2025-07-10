-- MySQL CREATE TABLE statement for OUC Access Control System
-- Based on AccessRequestForm.tsx field definitions

CREATE TABLE IF NOT EXISTS church_members (
    EmpID INT AUTO_INCREMENT PRIMARY KEY,
    lastname VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    PictureUrl VARCHAR(500) NULL,
    EmailValidationDate DATETIME NULL,
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DeviceID VARCHAR(100) NULL,
    userid VARCHAR(50) NOT NULL UNIQUE,
    gmail VARCHAR(255) NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    IsAdmin BOOLEAN NOT NULL DEFAULT FALSE,
    IsChurchMember BOOLEAN NOT NULL DEFAULT FALSE,
    IsApproved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for better query performance
    INDEX idx_email (email),
    INDEX idx_userid (userid),
    INDEX idx_lastname (lastname),
    INDEX idx_deviceid (DeviceID),
    INDEX idx_isadmin (IsAdmin),
    INDEX idx_isactive (IsActive),
    INDEX idx_requestdate (RequestDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments to document the table structure
ALTER TABLE church_members 
COMMENT = 'OUC Access Control System - Church Members and Access Requests';

-- Add column comments for documentation
ALTER TABLE church_members 
MODIFY COLUMN EmpID INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Primary key - Employee ID',
MODIFY COLUMN lastname VARCHAR(100) NOT NULL COMMENT 'Last name of the person',
MODIFY COLUMN firstname VARCHAR(100) NOT NULL COMMENT 'First name of the person',
MODIFY COLUMN phone VARCHAR(20) NOT NULL COMMENT 'Phone number in (XXX) XXX-XXXX format',
MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Primary email address',
MODIFY COLUMN PictureUrl VARCHAR(500) NULL COMMENT 'URL or path to profile picture',
MODIFY COLUMN EmailValidationDate DATETIME NULL COMMENT 'Date when email was validated',
MODIFY COLUMN RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date when access request was submitted',
MODIFY COLUMN DeviceID VARCHAR(100) NULL COMMENT 'Mobile device ID for access control',
MODIFY COLUMN userid VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique user ID (lastname + last4 digits of phone)',
MODIFY COLUMN gmail VARCHAR(255) NULL COMMENT 'Gmail address (for Google OAuth users)',
MODIFY COLUMN IsActive BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the user account is active',
MODIFY COLUMN IsAdmin BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether user has admin privileges',
MODIFY COLUMN IsChurchMember BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether user is a church member',
MODIFY COLUMN IsApproved BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Whether access request is approved',
MODIFY COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp'; 