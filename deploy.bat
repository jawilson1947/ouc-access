@echo off
echo Adding all changes to staging...
git add .

echo Committing changes...
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message=Update project build

git commit -m "%message%"

echo Pushing to GitHub...
git push origin main

echo Done!
pause 