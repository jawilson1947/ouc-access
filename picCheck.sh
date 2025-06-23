#!/bin/bash
echo "=== File Existence Check ==="
ls -la public/images/ | grep -E "(PhotoID|WilsonPaula)"

echo -e "\n=== File Permissions ==="
stat public/images/PhotoID.jpeg
stat public/images/WilsonPaula0580.jpeg

echo -e "\n=== Web Server Access Test ==="
sudo -u www-data test -r public/images/WilsonPaula0580.jpeg && echo "File is readable by web server" || echo "File is NOT readable by web server"

echo -e "\n=== Recent 404 Errors ==="
tail -20 /var/log/nginx/error.log | grep -i wilsonpaula
