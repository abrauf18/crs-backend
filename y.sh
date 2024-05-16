#!/bin/bash
apt-get install nodejs -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc -y
nvm install 20.10.0 -y
nvm use 20.10.0 -y
npm install --global yarn -y
npm i -g pm2 -y