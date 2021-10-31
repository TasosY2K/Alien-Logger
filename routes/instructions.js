const { Router } = require("express");

const router = Router();

router.get("/instructions", (req, res) => {
  if (req.session.loggedin) {
    res.render("instructions");
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
