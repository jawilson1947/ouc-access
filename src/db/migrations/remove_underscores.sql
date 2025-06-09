-- Remove underscores from timestamp field names for consistency
ALTER TABLE ChurchMembers CHANGE COLUMN created_at createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ChurchMembers CHANGE COLUMN updated_at updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP; 