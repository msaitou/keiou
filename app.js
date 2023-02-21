const express = require("express");
const fs = require("fs");
const conf = require("config");
const port = 3333;
const app = express();
/** ログクラスの初期処理
 * @returns
 */
const logger = require("./initter.js").log();
global.log = logger;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  // res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTION");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTION");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.get("/", async (req, res) => {
  try {
    let preStr;
    if (req.query.result) preStr = fs.readFileSync("result.json", "utf8");
    else preStr = fs.readFileSync("setting.json", "utf8");
    let setting = JSON.parse(preStr);
    // console.log(setting);
    res.json({ data: setting, conf: conf });
  } catch (e) {
    logger.warn(e);
    res.json({ err: "エラーが発生しました。もう一度試しても同様の場合、齊藤に連絡してください。" });
  }
});
app.get("/conf", async (req, res) => {
  try {
    res.json({ conf: conf });
  } catch (e) {
    logger.warn(e);
    res.json({ err: "エラーが発生しました。もう一度試しても同様の場合、齊藤に連絡してください。" });
  }
});
app.post("/", async (req, res) => {
  try {
    let params = req.body;
    console.log("post", params);
    fs.writeFileSync("setting.json", JSON.stringify(params));
    console.log("setting.json");
    res.json({});
  } catch (e) {
    logger.warn(e);
    res.json({ err: "エラーが発生しました。もう一度試しても同様の場合、齊藤に連絡してください。" });
  }
});

app.listen(port);
