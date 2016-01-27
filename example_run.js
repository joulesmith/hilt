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
  "app": "./app/app.jsx",
  "favicon": null,
  "uploadPath": "C:\\Users\\Socrates\\Documents\\GitHub\\hilt\\uploads",
  "log": "dev"
});
