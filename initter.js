const conf = require("config");
const fs = require("fs");
const chrome = require("selenium-webdriver/chrome");

exports.db = async function (coll, method, cond = {}, doc) {
  let log = getLogInstance();
  // log.info(0);
  const mdb = require("mongodb");
  // log.info(1);
  const dbClient = mdb.MongoClient;
  // log.info(2);
  try {
    // log.debug("conf", conf);
    let db = await dbClient.connect(`mongodb://${conf.db.host}/`);
    // log.info(3);
    const dbName = db.db(conf.db.name);
    const collection = dbName.collection(coll);
    let res;
    // log.info(4);
    switch (method) {
      case "find":
        res = await collection.find(cond).toArray();
        break;
      case "findOne":
        res = await collection.findOne(cond);
        break;
      case "update":
        let cnt = 0;
        if (cond) {
          cnt = await collection.countDocuments(cond);
        }
        if (cnt) {
          res = await collection.updateOne(cond, { $set: doc });
        } else {
          // insert
          res = await collection.insertOne(doc);
        }
        break;
      case "insertMany":
        res = await collection.insertMany(doc);
        break;
      case "delete":
        res = await collection.deleteMany(doc);
      default:
    }
    log.info(5);
    // log.info(lines);
    db.close();
    return res;
  } catch (e) {
    throw e;
  }
};
function getLogInstance() {
  return global.log ? global.log : thisLog();
}

/** ログクラスの初期処理
 * @returns
 */
const thisLog = () => {
  const log = require("log4js");
  const logPath = "./log/";
  log.configure({
    appenders: {
      // フォーマットリファレンス　https://log4js-node.github.io/log4js-node/layouts.html#pattern-format
      out: {
        type: "stdout",
        layout: { type: "pattern", pattern: "[%d{yy-MM-dd hh:mm:ss} %[%.4p%]] %m ->%f{2} %l" },
      },
      app: {
        type: "dateFile",
        filename: `${logPath}/a.log`,
        pattern: "yyMMdd",
        keepFileExt: true,
        layout: { type: "pattern", pattern: "[%d{yy-MM-dd hh:mm:ss} %.4p] %m ->%f{2} %l" },
        daysToKeep: 14, // 指定した日数分保持
      },
      // app: {
      //   type: "file",
      //   filename: "log/a.log",
      //   pattern: "yyMMdd",
      //   keepFileExt: true,
      //   layout: { type: "pattern", pattern: "[%d{yy-MM-dd hh:mm:ss} %.4p] %m ->%f{2} %l" },
      //   backups: 14,  //
      // },
      wrapInfo: { type: "logLevelFilter", appender: "app", level: "info" },
    },
    // categories: { default: { appenders: ["out", "app"], level: "all" } },
    categories: {
      // enableCallStack: true でフォーマットの%fや%lが有効になる
      default: { appenders: ["out", "wrapInfo"], level: "all", enableCallStack: true },
    },
  });
  // 古いファイルを削除してくれないので、自分で消す
  // 10個残す。　logファイルがあるフォルダで、a.*.logを古い順にけす
  const KEEP_NUM = 10;
  let files = fs.readdirSync(logPath);
  files = files.filter((f) => /^(a|m)\.\d{6}\.log$/.test(f)); // aかm.数字6桁.logという文字列をチェック
  let cnt = files.length;
  for (let f of files) {
    if (cnt > KEEP_NUM) {
      fs.unlinkSync(`${logPath}/${f}`);
      cnt--;
    }
  }
  const logger = log.getLogger();
  logger.level = "all";
  return logger;
};
exports.log = thisLog;

const getDriverPath = async function () {
  let log = getLogInstance();
  try {
    const selenium = require("selenium-download");
    // Driverをダウンロードするディレクトリを指定
    const path = __dirname + "/bin";
    log.debug(path);
    try {
      // # Driverのダウンロードとアップデート
      await new Promise((resolve, reject) => {
        selenium.ensure(path, (e) => {
          if (e) console.error(e.stack);
          // log.info("?????");
          resolve(true);
        });
      });
      log.info("desuyoehn");
    } catch (ee) {
      log.info(ee);
    }
    // # ChromeDriverのパスを返す。
    return `${path}/${process.platform === "win32" ? "chromedriver.exe" : "chromedriver"}`;
  } catch (error) {
    throw error;
  }
};
exports.getDriverPath = getDriverPath;

exports.initBrowserDriver = async function (isMob = false, headless = true) {
  let log = getLogInstance();
  // # Driverのパスを取得する
  let driverPath = await getDriverPath();
  log.info(`driver${driverPath}`);

  // # Driverのパスを渡す
  let service = new chrome.ServiceBuilder(driverPath).build();
  const chromeOptions = new chrome.Options();
  // https://selenium-world.net/selenium-tips/3519/
  chromeOptions.addArguments(`--user-data-dir=${conf.chrome["user-data-dir"]}`);
  chromeOptions.addArguments(`--profile-directory=${conf.chrome["profile"]}`);
  chromeOptions.addArguments("--disable-blink-features=AutomationControlled");
  if (conf.proxy.host && conf.proxy.port) chromeOptions.addArguments(`--proxy-server=http://${conf.proxy.host}:${conf.proxy.port}`);
  chromeOptions.addArguments("--lang=en");
  // if (headless) chromeOptions.addArguments("--headless=new");
  if (headless) chromeOptions.addArguments("--headless");
  let defoSer = null;
  try {
    defoSer = chrome.getDefaultService();
  } catch (e) {}
  if (defoSer && defoSer.isRunning()) {
    defoSer.kill();
  }
  if (!defoSer || !defoSer.isRunning()) {
    if (isMob) {
      chromeOptions.setMobileEmulation({
        deviceName: "Pixel 5",
      });
    }
  }
  return chrome.Driver.createSession(chromeOptions, service);
};
