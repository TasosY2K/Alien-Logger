const fs = require("fs");
const http = require("http");
const clear = require("clear");
const chalk = require("chalk");
const https = require("https");
const figlet = require("figlet");
const cron = require("node-cron");
const mysqldump = require("mysqldump");
const cliTable = require("cli-table3");

const app = require("./app");
const connection = require("./utils/database");
const config = require("./config.json");

const showInfo = (databaseInput) => {
  figlet("Alien Logger", { font: "Elite" }, (error, data) => {
    clear();
    let table = new cliTable({
      chars: {
        top: "═",
        "top-mid": "╤",
        "top-left": "╔",
        "top-right": "╗",
        bottom: "═",
        "bottom-mid": "╧",
        "bottom-left": "╚",
        "bottom-right": "╝",
        left: "║",
        "left-mid": "╟",
        mid: "─",
        "mid-mid": "┼",
        right: "║",
        "right-mid": "╢",
        middle: "│",
      },
    });
    table.push(
      [{ colSpan: 2, content: data }],
      [{ colSpan: 2, content: chalk.yellow("Info") }],
      ["Version", config.version],
      ["NodeJS", process.version],
      ["Author", config.author],
      ["URL", config.url],
      ["Port", config.port],
      ["SSL Port", config.securePort],
      ["Registered users", databaseInput.length],
      [{ colSpan: 2, content: chalk.yellow("Routes") }]
    );
    app._router.stack.forEach((item) => {
      if (item.route) {
        let method;
        if (item.route.methods.post) {
          method = chalk.cyan("POST");
        } else {
          method = chalk.green("GET");
        }
        table.push([method, item.route.path]);
      }
    });
    console.log(table.toString());
  });
};

(() => {
  cron.schedule("0 0 * * *", () => {
    filename = `./db-backups/backup-${moment().format("YYYY-MM-DD")}.sql`;
    mysqldump({
      connection: config.database,
      dump: {
        data: {
          format: false,
        },
      },
      dumpToFile: filename,
    });
    logger(`Database backup => ${filename}`);
  });

  connection.query(`SELECT * FROM accounts`, (error, results, fields) => {
    if (error) {
      logger("Could not connect to database");
      setInterval(() => {
        process.exit();
      }, 100);
    } else {
      showInfo(results);
      logger("Alien Logger Started");
    }
  });

  if (config.https) {
    https
      .createServer(
        {
          key: fs.readFileSync("./certs/server.key"),
          cert: fs.readFileSync("./certs/server.cert"),
        },
        app
      )
      .listen(config.securePort, "0.0.0.0");
  } else http.createServer(app).listen(config.port, "0.0.0.0");
})();
