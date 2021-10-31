const { Router } = require("express");

const connection = require("./utils/database");
const config = require("./config.json");

const router = Router();

router.post("/logs", (req, res) => {
  if (req.session.loggedin) {
    connection.query(
      `SELECT CONVERT(log USING utf8) FROM accounts WHERE username = '${req.session.username}'`,
      (error, results, fields) => {
        if (results.length > 0) {
          let text = results[0]["CONVERT(log USING utf8)"];
          dec = decrypt_aes_256(text, req.session.api_key);
          res.render("logs", { logs: dec });
          logger(`${req.cf_ip} | ${req.session.username} requested logs`);
        } else {
          res.render("alert", {
            title: "Database Error",
            message: "Could not fetch data",
          });
        }
      }
    );
  } else {
    res.redirect("/home");
  }
});

module.exports = router;
