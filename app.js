const express = require("express");
const fs = require("fs");
const conf = require("config");
const port = 3333;
const app = express();
/** ログクラスの初期処理
 * @returns
 */
const log = () => {
  const log = require("log4js");
  log.configure({
    appenders: {
      // フォーマットリファレンス　https://log4js-node.github.io/log4js-node/layouts.html#pattern-format
      out: {
        type: "stdout",
        layout: { type: "pattern", pattern: "[%d{yy-MM-dd hh:mm:ss} %[%.4p%]] %m ->%f{2} %l" },
      },
      app: {
        type: "dateFile",
        filename: "log/a.log",
        pattern: "yyMMdd",
        keepFileExt: true,
        layout: { type: "pattern", pattern: "[%d{yy-MM-dd hh:mm:ss} %.4p] %m ->%f{2} %l" },
      },
      wrapInfo: { type: "logLevelFilter", appender: "app", level: "info" },
    },
    // categories: { default: { appenders: ["out", "app"], level: "all" } },
    categories: {
      // enableCallStack: true でフォーマットの%fや%lが有効になる
      default: { appenders: ["out", "wrapInfo"], level: "all", enableCallStack: true },
    },
  });
  const logger = log.getLogger();
  logger.level = "all";
  return logger;
};

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
    log.warn(e);
    res.json({ err: "エラーが発生しました。もう一度試しても同様の場合、齊藤に連絡してください。" });
  }
});
app.get("/conf", async (req, res) => {
  try {
    res.json({ conf: conf.defo_info });
  } catch (e) {
    log.warn(e);
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
    log.warn(e);
    res.json({ err: "エラーが発生しました。もう一度試しても同様の場合、齊藤に連絡してください。" });
  }
});

app.listen(port);
