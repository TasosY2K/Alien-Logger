const { Router } = require("express");

const router = Router();

router.get("/about", (req, res) => {
  if (req.session.loggedin) {
    res.render("about");
  } else {
    res.redirect("/login");
  }
});

module.exports = router;
