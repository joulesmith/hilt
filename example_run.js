var path = require('path');

require('./index.js')({
  artificialDelay: 500,
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
  "appPath": "./app/app.jsx",
  "favicon": null,
  "uploadPath": path.join(__dirname, "uploads"),
  "log": "dev",
  modelPaths: [
    './models/user',
    './models/user-google-auth',
    './models/group',
    './models/admin',
    './models/email',
    './models/phone',
    './models/file',
    './models/crud', // basic CRUD example
    './models/blotter', // slightly more complicated example
    './models/payment'
  ]
});
