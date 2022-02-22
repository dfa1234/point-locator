# PointLocator

For starting the api with PM2

```
    npm install
    sudo npm install -g pm2
    sudo pm2 install typescript
    cd api
    npm install
    mkdir images
    cp config.ts.sample config.ts
    # then configure config.ts file accordingly
    pm2 start index.ts
    pm2 log
```
