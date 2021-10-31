const mysql = require("mysql");

const config = require("../config.json");
const connection = mysql.createConnection(config.database);

connection.on("error", (err) => {
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    logger("Lost database connection");
    setInterval(() => {
      process.exit();
    }, 100);
  } else {
    logger("Database error");
    setInterval(() => {
      process.exit();
    }, 100);
  }
});

module.exports = connection;
