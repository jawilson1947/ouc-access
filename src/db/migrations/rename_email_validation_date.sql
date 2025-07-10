-- Rename email_validation_date column to EmailValidationDate
ALTER TABLE ChurchMembers CHANGE COLUMN email_validation_date EmailValidationDate DATETIME; 