const { Router } = require("express");

const connection = require("./utils/database");
const config = require("./config.json");

const router = Router();

app.get("/home", (req, res) => {
  if (req.session.loggedin) {
    connection.query(
      `SELECT * FROM accounts WHERE username = '${req.session.username}'`,
      (error, results, fields) => {
        if (results.length > 0) {
          res.render("home", {
            username: `Welcome back, ${req.session.username}`,
            api_key: req.session.api_key,
            last_client_ip: results[0].last_client_ip,
            last_client_login: results[0].last_client_login,
            log_size:
              Math.round(Buffer.from(results[0].log).length / 1024) + "kb",
          });
        } else {
          res.render("alert", {
            title: "Database Error",
            message: "Could not fetch data",
          });
        }
      }
    );
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
