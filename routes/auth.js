const { Router } = require("express");
const request = require("request");
const bcrypt = require("bcrypt");
const moment = require("moment");

const connection = require("./utils/database");
const config = require("./config.json");

const router = Router();

// Utils
const {
  validateUsername,
  validatePassword,
  validateEmail,
} = require("./utils/validation");
const { encryptAES256, decryptAES256 } = require("./utils/crypto");

router.get("/login", (req, res) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render("login", { sitekey: config.recaptcha.site_key });
  }
});

router.get("/register", (req, res) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render("register", { sitekey: config.recaptcha.site_key });
  }
});

router.get("/logout", (req, res) => {
  let user = req.session.username;
  logger(`${req.cf_ip} | ${user} logged out`);
  req.session.destroy();
  res.redirect("/home");
});

router.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  if (
    req.body["g-recaptcha-response"] === undefined ||
    req.body["g-recaptcha-response"] === "" ||
    req.body["g-recaptcha-response"] === null
  ) {
    res.render("alert", {
      title: "Recaptcha not verified",
      message: "Please complete the recaptcha verification",
    });
  } else {
    let secretKey = config.recaptcha.secret_key;
    let verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body["g-recaptcha-response"]}&remoteip=${req.connection.remoteAddress}`;
    request(verificationURL, (err, resp, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        res.render("alert", {
          title: "Recaptcha not verified",
          message: "Please complete the recaptcha verification",
        });
        logger(`${req.cf_ip} | Failed recaptcha | ${username}:${password}`);
      } else {
        if (username && password) {
          connection.query(
            `SELECT * FROM accounts WHERE username = '${username}'`,
            (error, results, fields) => {
              if (results.length > 0) {
                if (bcrypt.compareSync(password, results[0].password)) {
                  req.session.loggedin = true;
                  req.session.username = username;
                  req.session.password = password;
                  req.session.api_key = results[0].api_key;
                  res.redirect("/home");
                  connection.query(
                    `UPDATE accounts SET last_ip = '${
                      req.cf_ip
                    }', last_login = '${moment().format(
                      "YYYY-MM-DD HH:mm:ss Z"
                    )}' WHERE username = '${username}'`,
                    (error, results, fields) => {}
                  );
                  logger(`${req.cf_ip} | ${username} logged in`);
                } else {
                  res.render("alert", {
                    title: "Password Error",
                    message: "Incorrect password",
                  });
                  logger(
                    `${req.cf_ip} | Failed login | ${username}:${password}`
                  );
                }
              } else {
                connection.query(
                  `SELECT * FROM accounts WHERE email = '${username}'`,
                  (error, results, fields) => {
                    if (results.length > 0) {
                      if (bcrypt.compareSync(password, results[0].password)) {
                        req.session.loggedin = true;
                        req.session.username = results[0].username;
                        req.session.password = password;
                        req.session.api_key = results[0].api_key;
                        res.redirect("/home");
                        connection.query(
                          `UPDATE accounts SET last_ip = '${
                            req.cf_ip
                          }', last_login = '${moment().format(
                            "YYYY-MM-DD HH:mm:ss Z"
                          )}' WHERE username = '${results[0].username}'`,
                          (error, results, fields) => {}
                        );
                        logger(
                          `${req.cf_ip} | ${results[0].username} logged in`
                        );
                      } else {
                        res.render("alert", {
                          title: "Password Error",
                          message: "Incorrect password",
                        });
                        logger(
                          `${req.cf_ip} | Failed login | ${username}:${password}`
                        );
                      }
                    } else {
                      res.render("alert", {
                        title: "Username Error",
                        message: "User does not exist",
                      });
                      logger(
                        `${req.cf_ip} | Failed login | ${username}:${password}`
                      );
                    }
                  }
                );
              }
            }
          );
        } else {
          res.render("alert", {
            title: "Input Error",
            message: "Empty username or password",
          });
        }
      }
    });
  }
});

router.post("/register", (req, res) => {
  let username = req.body.username;
  let emailAddress = req.body.emailAddress;
  let password = req.body.password;
  let confirm = req.body.confirm;
  if (
    req.body["g-recaptcha-response"] === undefined ||
    req.body["g-recaptcha-response"] === "" ||
    req.body["g-recaptcha-response"] === null
  ) {
    res.render("alert", {
      title: "Recaptcha not verified",
      message: "Please complete the recaptcha verification",
    });
  } else {
    let secretKey = config.recaptcha.secret_key;
    let verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body["g-recaptcha-response"]}&remoteip=${req.connection.remoteAddress}`;
    request(verificationURL, (err, resp, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        res.render("alert", {
          title: "Recaptcha not verified",
          message: "Please complete the recaptcha verification",
        });
        logger(`${req.cf_ip} | Failed recaptcha | ${username}:${password}`);
      } else {
        if (username && password && emailAddress && confirm) {
          if (password === confirm) {
            if (validateUsername(username)) {
              if (validatePassword(password)) {
                if (validateEmail(emailAddress)) {
                  connection.query(
                    `SELECT * FROM accounts WHERE username = '${username}' OR email = '${emailAddress}'`,
                    (error, results, fields) => {
                      if (results.length > 0) {
                        res.render("alert", {
                          title: "Username Error",
                          message: "This username or email is taken",
                        });
                      } else {
                        let api_key = uuid();
                        connection.query(
                          `INSERT INTO accounts(date_created, last_login, last_ip, last_client_login, last_client_ip, api_key, username, password, email, log) VALUES ('${moment().format(
                            "YYYY-MM-DD HH:mm:ss Z"
                          )}', 'Not logged in yet', '${
                            req.cf_ip
                          }', 'Not connected yet', 'Not connected yet', '${api_key}','${username}','${bcrypt.hashSync(
                            password,
                            10
                          )}','${emailAddress}','${encryptAES256(
                            "No logs yet",
                            api_key
                          )}')`,
                          (error, results, fields) => {
                            res.render("alert", {
                              title: "Sucessfuly Registered",
                              message: "You can now login",
                            });
                            logger(
                              `${req.cf_ip} | ${username} registered | api_key:${api_key}`
                            );
                          }
                        );
                      }
                    }
                  );
                } else {
                  res.render("alert", {
                    title: "Validation Error",
                    message: "Invalid email",
                  });
                }
              } else {
                res.render("alert", {
                  title: "Validation Error",
                  message:
                    "Password must contain at least one digit/lowercase/uppercase letter and be at least 8 characters long",
                });
              }
            } else {
              res.render("alert", {
                title: "Validation Error",
                message:
                  "Username must be 5-50 letters long and can't contain non-English or special characters",
              });
            }
          } else {
            res.render("alert", {
              title: "Password Error",
              message: "Passwords don't match",
            });
          }
        } else {
          res.render("alert", {
            title: "Input Error",
            message: "Empty username or password",
          });
        }
      }
    });
  }
});

router.post("/account", (req, res) => {
  if (req.session.loggedin) {
    let username = req.body.username;
    let emailAddress = req.body.emailAddress;
    let old_password = req.body.oldPassword;
    let new_password = req.body.newPassword;
    if (username && emailAddress && old_password && new_password) {
      if (validateUsername(username)) {
        if (validatePassword(new_password)) {
          if (validateEmail(emailAddress)) {
            connection.query(
              `SELECT * FROM accounts WHERE username = '${req.session.username}'`,
              (error, results, fields) => {
                if (results.length > 0) {
                  if (bcrypt.compareSync(old_password, results[0].password)) {
                    connection.query(
                      `UPDATE accounts SET username = '${username}', email = '${emailAddress}', password = '${bcrypt.hashSync(
                        new_password,
                        10
                      )}' WHERE username = '${req.session.username}'`,
                      (error, results, fields) => {
                        if (results.affectedRows === 1) {
                          logger(`${req.cf_ip} | ${username} edited account`);
                          res.redirect("/logout");
                        } else {
                          res.render("alert", {
                            title: "Database Error",
                            message: "Account could not be edited",
                          });
                        }
                      }
                    );
                  } else {
                    res.render("alert", {
                      title: "Password Error",
                      message: "Incorrect password",
                    });
                  }
                } else {
                  res.render("alert", {
                    title: "Database Error",
                    message: "Could not fetch data",
                  });
                }
              }
            );
          } else {
            res.render("alert", {
              title: "Validation Error",
              message: "Invalid email",
            });
          }
        } else {
          res.render("alert", {
            title: "Validation Error",
            message:
              "Password must contain at least one digit/lowercase/uppercase letter and be at least 8 characters long",
          });
        }
      } else {
        res.render("alert", {
          title: "Validation Error",
          message:
            "Username must be 5-50 letters long and can't contain non-English or special characters",
        });
      }
    } else {
      res.render("alert", {
        title: "Password Error",
        message: "You can't leave any fields empty",
      });
    }
  } else {
    res.redirect("/home");
  }
});

router.delete("/delete", (req, res) => {
  if (req.session.loggedin) {
    connection.query(
      `SELECT * FROM accounts WHERE username = '${req.session.username}'`,
      (error, results, fields) => {
        if (results.length > 0) {
          if (bcrypt.compareSync(req.body.password, results[0].password)) {
            connection.query(
              `DELETE FROM accounts WHERE username='${req.session.username}'`,
              (error, results, fields) => {
                if (results.affectedRows === 1) {
                  logger(
                    `${req.cf_ip} | ${req.session.username} deleted account`
                  );
                  res.redirect("/logout");
                } else {
                  res.render("alert", {
                    title: "Database Error",
                    message: "Account could not be deleted",
                  });
                }
              }
            );
          } else {
            res.render("alert", {
              title: "Password Error",
              message: "Incorrect password",
            });
          }
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

router.get("/account", (req, res) => {
  if (req.session.loggedin) {
    connection.query(
      `SELECT * FROM accounts WHERE username = '${req.session.username}'`,
      (error, results, fields) => {
        if (results.length > 0) {
          res.render("account", {
            username: results[0].username,
            email: results[0].email,
            password: req.session.password,
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
    res.redirect("/home");
  }
});

module.exports = router;
