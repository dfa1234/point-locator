

# mongo install
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 9DA31620334BD75D9DCB49F368818C72E52529D4
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo service mongod start


# need to add key from ssh-keygen
cd ~
git clone <REPO_URL>
sudo npm -g install pm2 typescript ts-node
pm2 install typescript
cd <REPO_FOLDER>/api
pm2 start index.ts
pm2 log