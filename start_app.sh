//sudo docker stop oucaccess-container
//sudo docker rm oucaccess-container
//sudo chown -R zdogrxmy:zdogrxmy /var/www/oucaccess
// build -t oucaccess-image .
sudo docker run -v "$(pwd)/public:/app/public" -d -p 3000:3000 --name oucaccess-container oucaccess-image
