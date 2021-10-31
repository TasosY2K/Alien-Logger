const moment = require("moment");

function logger(input) {
  output = `${moment().format("YYYY-MM-DD HH:mm:ss Z")} | ${input}\n`;
  fs.appendFile("./log.txt", output, (err) => {
    if (err) console.log(err);
  });
}

module.exports = logger;
