const { Router } = require("express");

const router = Router();

router.get("/kill", (req, res) => {
  const status = String(config.kill);
  res.send(status.charAt(0).toUpperCase() + status.slice(1));
});

module.exports = router;
