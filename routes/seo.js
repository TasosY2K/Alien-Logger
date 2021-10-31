const { Router } = require("express");

const router = Router();

router.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname + "/robots.txt"));
});

router.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname + "/sitemap.xml"));
});

router.get("/icon", (req, res) => {
  res.sendFile(
    path.join(
      __dirname + "/img/icons/" + Math.floor(Math.random() * 2) + ".jpg"
    )
  );
});

router.get("/banner", (req, res) => {
  res.sendFile(
    path.join(
      __dirname + "/img/banners/banner" + Math.floor(Math.random() * 4) + ".jpg"
    )
  );
});

module.exports = router;
