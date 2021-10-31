const { Router } = require("express");
const moment = require("moment");

const connection = require("./utils/database");
const config = require("./config.json");

const router = Router();

router.post("/api", (req, res) => {
  if (req.query.key) {
    connection.query(
      `SELECT * FROM accounts WHERE api_key = '${req.query.key}'`,
      (error, results, fields) => {
        if (results.length > 0) {
          let { text } = req.body;
          text = text.join().replace(/,/g, "");
          crypted = encrypt_aes_256(text, req.query.key);
          connection.query(
            `UPDATE accounts SET last_client_login='${moment().format(
              "YYYY-MM-DD HH:mm:ss Z"
            )}', last_client_ip='${
              req.cf_ip
            }', log='${crypted}' WHERE api_key='${req.query.key}'`,
            (error, results, fields) => {
              if (error) {
                console.log(error);
                res.send("Database error" + error);
              } else {
                res.send("File uploaded successfuly");
                logger(
                  `${req.cf_ip} | Successful file upload from client: ${req.query.key}`
                );
              }
            }
          );
        } else {
          res.send("Incorrect api key");
          logger(
            `${req.cf_ip} | Failed file upload from client: ${req.query.key}`
          );
        }
      }
    );
  } else {
    res.send("No api key provided");
  }
});

router.post("/keycheck", (req, res) => {
  if (req.query.key) {
    connection.query(
      `SELECT * FROM accounts WHERE api_key = '${req.query.key}'`,
      (error, results, fields) => {
        if (results.length > 0) {
          res.sendStatus(200);
        } else {
          res.sendStatus(403);
        }
      }
    );
  } else {
    res.send("No api key provided");
  }
});

module.exports = router;
