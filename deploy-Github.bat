@echo off
echo Checking git status...
git status

echo.
echo Adding all changes to staging...
git add .

echo.
set /p message="Enter commit message (or press Enter for default): "
if "%message%"=="" set message=Update project build

echo Committing changes...
git commit -m "%message%"
if errorlevel 1 (
    echo Error: Commit failed!
    pause
    exit /b 1
)

echo.
echo Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo Error: Push failed!
    pause
    exit /b 1
)

echo.
echo Successfully deployed to GitHub!
pause 