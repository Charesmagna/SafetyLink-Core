const express = require("express");
const app = express();
app.get("*all", (req, res) => res.send("ok2"));
app.listen(3002, () => console.log("running"));
