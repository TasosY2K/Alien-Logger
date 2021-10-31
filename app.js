// ▄▄▄· ▄▄▌  ▪  ▄▄▄ . ▐ ▄     ▄▄▌         ▄▄ •  ▄▄ • ▄▄▄ .▄▄▄
//▐█ ▀█ ██•  ██ ▀▄.▀·•█▌▐█    ██•  ▪     ▐█ ▀ ▪▐█ ▀ ▪▀▄.▀·▀▄ █·
//▄█▀▀█ ██▪  ▐█·▐▀▀▪▄▐█▐▐▌    ██▪   ▄█▀▄ ▄█ ▀█▄▄█ ▀█▄▐▀▀▪▄▐▀▀▄
//▐█ ▪▐▌▐█▌▐▌▐█▌▐█▄▄▌██▐█▌    ▐█▌▐▌▐█▌.▐▌▐█▄▪▐█▐█▄▪▐█▐█▄▄▌▐█•█▌
// ▀  ▀ .▀▀▀ ▀▀▀ ▀▀▀ ▀▀ █▪    .▀▀▀  ▀█▄▀▪·▀▀▀▀ ·▀▀▀▀  ▀▀▀ .▀  ▀
// https://xn--rihy934p.ws

const express = require("express");
const session = require("express-session");
const cloudflare = require("cloudflare-express");
const ipfilter = require("ipfilter");
const path = require("path");
const uuid = require("uuid/v1");

const fileWalker = require("./utils/filewalker");

const config = require("./config.json");

const app = express();

app.set("view engine", "pug");

let ips = config.blacklist;
app.use(ipfilter(ips));

app.use(
  session({
    secret: uuid(),
    resave: true,
    saveUninitialized: true,
  })
);

app.use(cloudflare.restore({ update_on_start: true }));

app.use(express.json({ limit: "500mb" }));
app.use(
  express.urlencoded({
    limit: "500mb",
    extended: true,
    parameterLimit: 1000000,
  })
);

app.get("/discord", (req, res) => {
  res.redirect(config.discordInvite);
});

app.get("/img", (req, res) => {
  let num = req.query.num;
  if (num && num <= 6) {
    res.sendFile(path.join(__dirname + "/img/pic" + req.query.num + ".png"));
  } else {
    res.send("No image specified or out of range");
  }
});

app.get("*", (req, res) => {
  res.render("alert", {
    title: "Error 404",
    message: "Page could not be found",
  });
});

const loadRoutes = async () => {
  const routes = await fileWalker.walk(__dirname + "/routes/");

  routes.forEach((route) => {
    const time = new Date().getMilliseconds();
    require(route.path)(app, con, globalConfig);
    console.log(
      `Loaded ${route.name} in ${new Date().getMilliseconds() - time}ms`
    );
  });
};

module.exports = { app, loadRoutes };
