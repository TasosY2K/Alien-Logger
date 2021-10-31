const { Router } = require("express");

const router = Router();

router.get("/", (req, res) => {
  if (req.session.loggedin) {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

module.exports = router;
