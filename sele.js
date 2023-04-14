const logger = require("./initter.js").log();
global.log = logger;
logger.info("start!");
logger.debug(process.argv);
const conf = require("config");
const sqliteDb = require("./sql").sqliteDb;
const db = new sqliteDb();
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
      // let preStr = fs.readFileSync("setting.json", "utf8");
      let preStr = { items: await db.select("ITEMS") };
      let aca = await db.select("ACCOUNT");
      preStr["account"] = aca[0];
      // let setting = JSON.parse(preStr);
      let setting = preStr;
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
      for (let i2 = 0; i2 < 3 && reciptNum == ""; i2++) {
        // ログインに時間がかかった時用のリトライ用
        if (!this.getDriver()) {
          this.setDriver(await this.webDriver(false, conf.chrome.headless));
        }
        try {
          await this.driver.get(`${this.baseUrl}`); // このページを解析
          let se = ["input[id*='userId']", "input[id*='password']", "input[id*='submit']"];
          if (await this.isExistEle(se[0], true, 5000)) {
            // アカウント入力
            let inputEle = await this.getEle(se[0], 100);
            await inputEle.clear();
            await inputEle.sendKeys(account.id);
            // パスワード入力
            inputEle = await this.getEle(se[1], 100);
            await inputEle.clear();
            await inputEle.sendKeys(account.password);
            inputEle = await this.getEle(se[2], 100);
            let startTime = new Date().setHours(conf.start_time.h, conf.start_time.m, conf.start_time.s, 0);
            for (; i2 === 0 && startTime > new Date(); ) {
              await this.sleep(startTime - new Date() > 10000 ? 1000 : 200);
            }
            await this.clickEle(inputEle, 100);
            se = ["select[id*='jyoushaDate']", "select[id*='destination']", "#vacancyButton"];
            if (await this.isExistEle(se[0], true, 2000)) {
              // 1秒以内に見つからないとほぼリトライ
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
            } else throw "ログイン後の遷移に2秒以上時間かかった";
            if (await this.isExistEle(se[1], true, 2000)) {
              // 行先選択
              let el = await this.getEle(se[1], 2000);
              let select = new Select(el);
              let selectVal = "R003"; // 京王八王子・高尾山口→新宿方面
              if (selectVal) await select.selectByValue(selectVal); // 行先選択
            } else throw "行先選択が見つからない(2秒以上時間かかった)";
            if (await this.isExistEle(se[2], true, 2000)) {
              // 照会　上の条件で
              let el = await this.getEle(se[2], 5000);
              await this.clickEle(el, 100);
              se = [
                "div.train:not(.saleEnd)",
                "div.stationInfo>div",
                "ancestor::div[@class='train']",
                "div.trainInfo a.submitButton",
              ];
              if (await this.isExistEle(se[0], true, 2000)) {
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
                        await this.clickEle(el2[0], 100); // ページ遷移
                        isBreak = true;
                        break;
                      }
                    }
                    if (isBreak) break;
                  }
                }
                se = ["select[id*='jyoushaStationTime']", "input[id*='seatAssignBtn']"];
                if (await this.isExistEle(se[0], true, 2000)) {
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
                } else throw "乗車日選択が見つからない(2秒以上時間かかった)";
                if (await this.isExistEle(se[1], true, 2000)) {
                  let el = await this.getEle(se[1], 5000);
                  await this.clickEle(el, 100);
                  for (let i3 = 0; i3 < 3 && reciptNum == ""; i3++) {
                    // ループポイント
                    try {
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
                          await this.clickEle(el, 100);
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
                            await this.clickEle(el2[0], 100);
                            break;
                          }
                        }
                        if (isFound) {
                          if (await this.isExistEle(se[2], true, 5000)) {
                            let el = await this.getEle(se[2], 5000);
                            await this.clickEle(el, 100); // 遷移
                            // https://www.keio-ticketless.jp/keio-web/ticket/train_seat_allocated.xhtml
                            se = [
                              "input[id*='agreement']",
                              "input[type='password']",
                              "input[id*='nextPaymentBtn']",
                              "div.inputArea div.number",
                            ];
                            // if (await this.isExistEle(se[0], true, 30000 * 4)) {
                            if (await this.isExistEle(se[0], true, 30000)) {
                              // ■■決済確認画面
                              let el = await this.getEle(se[0], 30000);
                              await this.clickEle(el, 5000); // 同意ボタン
                              if (await this.isExistEle(se[1], true, 30000)) {
                                let el = await this.getEle(se[1], 30000);
                                await el.clear();
                                await el.sendKeys(account.password); // 確認用のパスワード入力
                                if (await this.isExistEle(se[2], true, 30000)) {
                                  // throw("test")
                                  let el = await this.getEle(se[2], 30000);
                                  await this.clickEle(el, 5000); // 遷移
                                  if (await this.isExistEle(se[3], true, 30000)) {
                                    let el = await this.getEle(se[3], 30000);
                                    reciptNum = await el.getText();
                                    // break;
                                  }
                                }
                              }
                            } else throw "時間がかかってる？";
                          }
                        } else throw "既に確保されちゃった！"; // これはループしても無駄
                      } else throw "選択する座席一覧が見つからない(5秒以上時間かかった)";
                    } catch (e3) {
                      let cUrl = await this.driver.getCurrentUrl();
                      if (
                        e3 != "時間がかかってる？" ||
                        cUrl.indexOf("www.keio-ticketless.jp/keio-web/ticket/train_seat_assign.xhtml") === -1
                      )
                        throw e3; // バブリング
                      fName = await logedErr(this.driver, this.logger, e3);
                      // 消す予定
                      // await this.driver.navigate().refresh(); // 画面更新
                      //"時間がかかってる？"時はこのURLなはず。だけどそうじゃないときがあるか。 "https://www.keio-ticketless.jp/keio-web/ticket/train_seat_assign.xhtml"
                    }
                  }
                } else throw "座席選択画面へのボタンが見つからない(2秒以上時間かかった)";
              }
            } else throw "照会ボタンが見つからない(2秒以上時間かかった)";
          }
        } catch (ee) {
          if (ee == "既に確保されちゃった！") throw ee; // バブリング
          fName = await logedErr(this.driver, this.logger, ee);
        }
      }
    } catch (e) {
      fName = await logedErr(this.driver, this.logger, e);
    } finally {
      task.recipt_num = reciptNum; // 予約できた印
      if (!reciptNum && fName) task.f_name = fName;
      // let preStr = { items: await db.select("RESULTS") };
      // let preStr = fs.readFileSync("./result.json", "utf8");
      // let result = JSON.parse(preStr);
      // let result = preStr;
      // result.items = [...result.items, { ...task}];
      await db.insert("RESULTS", [task]);
      // await fs.writeFileSync("./result.json", JSON.stringify(result));
      await this.quitDriver();
    }
  }
}
async function logedErr(driver, logger, e) {
  logger.info(e, await driver.getCurrentUrl());
  let w = await driver.executeScript("return document.body.scrollWidth;");
  let h = await driver.executeScript("return document.body.scrollHeight;");
  logger.info(w, h);
  await driver.manage().window().setRect({ width: w, height: h });
  let encodedString = await driver.takeScreenshot();
  fName = `${new Date().toJSON().replaceAll(":", "")}.png`;
  await fs.writeFileSync(`./log/${fName}`, encodedString, "base64");
  return fName;
}
start();
