const logger = require("./initter.js").log();
global.log = logger;
logger.info("start!");
logger.debug(process.argv);
const db = require("./initter.js").db;
const conf = require("config");
const fs = require("fs");
const { Builder, By, until, Select, Key } = require("selenium-webdriver");
async function start() {
  return new Promise(async (resolve, reject) => {
    logger.info(33);
    let Web = new WebCls();
    await Web.main();
    resolve(true);
  })
    .then((res) => {
      logger.info("res", res);
    })
    .catch((e) => {
      logger.error(e);
    })
    .finally(() => {
      logger.info("tyokuzen");
      process.exit();
    });
}

class WebCls {
  logger;
  constructor() {
    this.logger = global.log;
  }
  async main() {
    logger.info("こっちに来たね class版");
    try {
      // 自動予約設定ファイルを確認
      let preStr = fs.readFileSync("setting.json", "utf8");
      let setting = JSON.parse(preStr);
      if (setting.items && setting.account) {
        let today = new Date();
        let task = setting.items.filter((it) => it.book_date == today.toLocaleDateString())[0];
        logger.info(task);
        if (task) {
          const ana = new Analyzer();
          await ana.exec(task, setting.account);
          // ここでリターンを使って結果を更新かな？　TODO
        }
      }
    } catch (e) {
      logger.warn(e);
    }
  }
}
const { BaseWebDriverWrapper } = require("./base-webdriver-wrapper");

class Analyzer extends BaseWebDriverWrapper {
  baseUrl = "https://www.keio-ticketless.jp/keio-web/top.xhtml";
  constructor() {
    super();
    this.logger.info(`constructor`);
  }
  async exec(task, account) {
    this.logger.info("きた？", task, account);
    let reciptNum = "";
    let fName = "";
    try {
      if (!this.getDriver()) {
        this.setDriver(await this.webDriver(false, conf.chrome.headless));
      }
      await this.driver.get(`${this.baseUrl}`); // このページを解析
      let se = ["input[id*='userId']", "input[id*='password']", "input[id*='submit']"];
      if (await this.isExistEle(se[0], true, 5000)) {
        // アカウント入力
        let inputEle = await this.getEle(se[0], 500);
        await inputEle.clear();
        await inputEle.sendKeys(account.id);
        // パスワード入力
        inputEle = await this.getEle(se[1], 500);
        await inputEle.clear();
        await inputEle.sendKeys(account.password);
        inputEle = await this.getEle(se[2], 500);
        let startTime = new Date().setHours(conf.start_time.h, conf.start_time.m, conf.start_time.s, 0);
        for (; startTime > new Date(); ) {
          await this.sleep(startTime - new Date() > 10000 ? 1000 : 200);
        }
        await this.clickEle(inputEle, 1000);
        se = ["select[id*='jyoushaDate']", "select[id*='destination']", "#vacancyButton"];
        if (await this.isExistEle(se[0], true, 10000)) {
          // 乗車日選択
          let el = await this.getEle(se[0], 5000);
          let select = new Select(el);
          let optionList = await select.getOptions();
          let selectVal = "";
          for (let op of optionList) {
            let val = await op.getAttribute("value");
            if (val.indexOf(task.date_key) > -1) {
              selectVal = val;
              break;
            }
          }
          if (selectVal) await select.selectByValue(selectVal); // 乗車日選択
        }
        if (await this.isExistEle(se[1], true, 5000)) {
          // 行先選択
          let el = await this.getEle(se[1], 5000);
          let select = new Select(el);
          let selectVal = "R003"; // 京王八王子・高尾山口→新宿方面
          if (selectVal) await select.selectByValue(selectVal); // 行先選択
        }
        if (await this.isExistEle(se[2], true, 5000)) {
          // 照会　上の条件で
          let el = await this.getEle(se[2], 5000);
          await this.clickEle(el, 1000);
          se = [
            "div.train:not(.saleEnd)",
            "div.stationInfo>div",
            "ancestor::div[@class='train']",
            "div.trainInfo a.submitButton",
          ];
          if (await this.isExistEle(se[0], true, 5000)) {
            let els = await this.getEles(se[0], 5000);
            let isBreak = false;
            for (let i in els) {
              if (await this.isExistElesFromEle(els[i], se[1], true, 5000)) {
                let el0 = await this.getElesFromEle(els[i], se[1], 5000);
                for (let j in el0) {
                  let text = await el0[j].getProperty("innerText");
                  logger.debug(text);
                  if (text.indexOf("高幡不動") > -1 && text.indexOf(task.time) > -1) {
                    let el2 = await this.getElesXFromEle(el0[j], se[2], 5000);
                    el2 = await this.getElesFromEle(el2[0], se[3]);
                    await this.clickEle(el2[0], 1000); // ページ遷移
                    isBreak = true;
                    break;
                  }
                }
                if (isBreak) break;
              }
            }
            se = ["select[id*='jyoushaStationTime']", "input[id*='seatAssignBtn']"];
            if (await this.isExistEle(se[0], true, 5000)) {
              // 乗車日選択
              let el = await this.getEle(se[0], 5000);
              let select = new Select(el);
              let optionList = await select.getOptions();
              let selectVal = "";
              for (let op of optionList) {
                let val = await op.getText();
                if (val.indexOf("高幡不動") > -1 && val.indexOf(task.time) > -1) {
                  selectVal = val;
                  break;
                }
              }
              if (selectVal) await select.selectByVisibleText(selectVal); // 乗車駅・時刻選択
            }
            if (await this.isExistEle(se[1], true, 5000)) {
              let el = await this.getEle(se[1], 5000);
              await this.clickEle(el, 1000);
              // ■■座席選択画面
              let regex = "(\\d+)号車";
              let matches = task.t_num.match(regex);
              let num = matches[1].padStart(2, "0");
              se = [
                `input[id='carNumberBtn${num}']`,
                `#seatMap${num} td.seat>span:not(.noVacancySeat):not(.notSeat)`,
                "input#submit",
                "ancestor::td[@class='seat']",
              ];
              if (num != "10") {
                if (await this.isExistEle(se[0], true, 5000)) {
                  let el = await this.getEle(se[0], 5000);
                  await this.clickEle(el, 1000);
                }
              }
              if (await this.isExistEle(se[1], true, 5000)) {
                let els = await this.getEles(se[1], 5000);
                let isFound = false;
                for (let el1 of els) {
                  let seatNum = await el1.getText();
                  if (seatNum.trim() == task.s_num) {
                    logger.info("見つかった！", task.s_num);
                    isFound = true;
                    let el2 = await this.getElesXFromEle(el1, se[3], 5000);
                    await this.clickEle(el2[0], 1000);
                    break;
                  }
                }
                if (isFound) {
                  if (await this.isExistEle(se[2], true, 5000)) {
                    let el = await this.getEle(se[2], 5000);
                    await this.clickEle(el, 1000); // 遷移
                    se = [
                      "input[id*='agreement']",
                      "input[type='password']",
                      "input[id*='nextPaymentBtn']",
                      "div.inputArea div.number",
                    ];
                    if (await this.isExistEle(se[0], true, 5000)) {
                      // ■■決済確認画面
                      let el = await this.getEle(se[0], 5000);
                      // throw("test")
                      await this.clickEle(el, 5000); // 同意ボタン
                      if (await this.isExistEle(se[1], true, 5000)) {
                        let el = await this.getEle(se[1], 5000);
                        await el.clear();
                        await el.sendKeys(account.password); // 確認用のパスワード入力
                        if (await this.isExistEle(se[2], true, 5000)) {
                          let el = await this.getEle(se[2], 5000);
                          await this.clickEle(el, 1000); // 遷移
                          if (await this.isExistEle(se[3], true, 5000)) {
                            let el = await this.getEle(se[3], 5000);
                            reciptNum = await el.getText();
                          }
                        }
                      }
                    }
                  }
                } else {
                  throw "既に確保されちゃった！";
                }
              }
            }
          }
        }
      }
    } catch (e) {
      this.logger.info(e);
      let w = await this.driver.executeScript("return document.body.scrollWidth;");
      let h = await this.driver.executeScript("return document.body.scrollHeight;");
      this.logger.info(w, h);
      await this.driver.manage().window().setRect({ width: w, height: h });
      let encodedString = await this.driver.takeScreenshot();
      fName = `${new Date().toJSON().replaceAll(":", "")}.png`;
      await fs.writeFileSync(`./log/${fName}`, encodedString, "base64");
    } finally {
      task.recipt_num = reciptNum;
      if (fName) task.f_name = fName;
      let preStr = fs.readFileSync("./result.json", "utf8");
      let result = JSON.parse(preStr);
      result.items = [...result.items, { ...task, reciptNum: reciptNum }];
      await fs.writeFileSync("./result.json", JSON.stringify(result));
      await this.quitDriver();
    }
  }
}
start();
