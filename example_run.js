var path = require('path');

require('./index.js')({
  "name": "Hilt",
  "http": {
    "port": 3000
  },
  "db": {
    "database": "hilt",
    "host": "localhost",
    "port": 27017,
    // optional
    "username": null,
    "password": null
  },
  // optional
  "appPath": "./app/app.jsx",
  "favicon": null,
  "uploadPath": path.join(__dirname, "uploads"),
  "log": "dev",
  modelPaths: [
    './models/group',
    './models/email',
    './models/file',
    './models/account',
    './models/product',
    './models/service',
    './models/order',
    './models/receipt',
    './models/profile'
  ]
});
