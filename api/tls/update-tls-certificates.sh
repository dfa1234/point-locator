#!/bin/bash

# sudo certbot renew

export HOST=test.example.com

# copy keys

export PATH_KEY=/etc/letsencrypt/live/$HOST

sudo cp ${PATH_KEY}/privkey.pem ./privkey.pem
sudo cp ${PATH_KEY}/fullchain.pem ./fullchain.pem
sudo cp ${PATH_KEY}/chain.pem ./chain.pem
sudo cp ${PATH_KEY}/cert.pem ./cert.pem

