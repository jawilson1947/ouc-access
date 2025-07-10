-- Rename Picture_Url column to PictureUrl for consistency
ALTER TABLE ChurchMembers CHANGE COLUMN Picture_Url PictureUrl VARCHAR(255); 