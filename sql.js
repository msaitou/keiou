const sqlite3 = require("sqlite3").verbose();
const conf = require("config");
const db = new sqlite3.Database(conf.db);
const fs = require("fs");
class sqliteDb {
  TB = {
    NAME: { ACCOUNT: "aca", ITEMS: "items", RESULTS: "results" },
    ACCOUNT: { FIELD: ["id", "password"] },
    ITEMS: {
      FIELD: [
        "date",
        "date_key",
        "book_date",
        "'check'",
        "time",
        "t_num",
        "s_num",
      ],
    },
    RESULTS: {
      FIELD: [
        "date",
        "date_key",
        "book_date",
        "'check'",
        "time",
        "t_num",
        "s_num",
        "recipt_num",
        "f_name",
      ],
    },
  };
  constructor() {}
  // データの更新（一番楽なデリーとインサート固定）
  insert(tblKey, recs) {
    if (recs && recs.length > 0) {
      return new Promise((resolve, reject) => {
        db.serialize(() => {
          if (tblKey != "RESULTS") {
            // RESULTS以外
            db.run(`drop table if exists ${this.TB.NAME[tblKey]};`);
            db.run(
              `create table if not exists ${this.TB.NAME[tblKey]}(${this.TB[tblKey].FIELD});`
            );
          }
          recs.forEach((rec, i) => {
            if (tblKey == "RESULTS") {
              // RESULTSだけ
              if (!("f_name" in rec)) rec["f_name"] = "";
              delete rec["reciptNum"];
            }
            console.log(
              `insert into ${this.TB.NAME[tblKey]}(${
                this.TB[tblKey].FIELD
              }) values(${myValues(rec)})`
            );
            db.run(
              `insert into ${this.TB.NAME[tblKey]}(${
                this.TB[tblKey].FIELD
              }) values(${myValues(rec)});`,
              [],
              () => {
                if (i === recs.length - 1) resolve();
              }
            );
          });
        });
      });
    }
  }
  // sqlite3を同期的に返す　select用
  select(tblKey) {
    return new Promise((resolve, reject) => {
      db.all(`select * from ${this.TB.NAME[tblKey]}`, [], (err, rows) => {
        if (err) {
          reject(err, rows);
          return;
        }
        resolve(rows);
      });
    });
  }
}
exports.sqliteDb = sqliteDb;

function myValues(obj) {
  return Object.keys(obj).map((k) => {
    if (k != "check") return `"${obj[k]}"`;
    else return obj[k];
  });
}
async function main() {
  // ファイルの読み込み
  let strResult = fs.readFileSync("result.json", "utf8");
  let strSetting = fs.readFileSync("setting.json", "utf8");
  let preResult = JSON.parse(strResult);
  preResult.items.forEach((p) => {
    if (!("f_name" in p)) p["f_name"] = "";
    delete p["reciptNum"];
  });
  let preSetting = JSON.parse(strSetting);
  let dbc = new sqliteDb();
  db.serialize(() => {
    // アカウント
    db.run(`create table if not exists aca(${dbc.TB.ACCOUNT.FIELD});`);
    console.log(
      `insert into aca(${dbc.TB.ACCOUNT.FIELD}) values(${myValues(
        preSetting.account
      )});`
    );
    db.run(
      `insert into aca(${dbc.TB.ACCOUNT.FIELD}) values(${myValues(
        preSetting.account
      )});`
    );
    // 予約予定情報
    db.run(`create table if not exists items(${dbc.TB.ITEMS.FIELD});`);
    preSetting.items.forEach((item) => {
      console.log(
        `insert into items(${dbc.TB.ITEMS.FIELD}) values(${myValues(item)})`
      );
      db.run(
        `insert into items(${dbc.TB.ITEMS.FIELD}) values(${myValues(item)});`
      );
    });
    // 予約結果情報
    db.run(`create table if not exists results(${dbc.TB.RESULTS.FIELD});`);
    preResult.items.forEach((item) => {
      console.log(
        `insert into results(${dbc.TB.RESULTS.FIELD}) values(${myValues(item)})`
      );
      db.run(
        `insert into results(${dbc.TB.RESULTS.FIELD}) values(${myValues(
          item
        )});`
      );
    });
  });
  // } else {
  //   let aa = await select("ITEMS");
  //   console.log("aa", aa);
  // }
}
async function main() {
  // ファイルの読み込み
  let strResult = fs.readFileSync("result.json", "utf8");
  let strSetting = fs.readFileSync("setting.json", "utf8");
  let preResult = JSON.parse(strResult);
  preResult.items.forEach((p) => {
    if (!("f_name" in p)) p["f_name"] = "";
    delete p["reciptNum"];
  });
  let preSetting = JSON.parse(strSetting);
  let dbc = new sqliteDb();
  db.serialize(() => {
    // アカウント
    db.run(`create table if not exists aca(${dbc.TB.ACCOUNT.FIELD});`);
    console.log(
      `insert into aca(${dbc.TB.ACCOUNT.FIELD}) values(${myValues(
        preSetting.account
      )});`
    );
    db.run(
      `insert into aca(${dbc.TB.ACCOUNT.FIELD}) values(${myValues(
        preSetting.account
      )});`
    );
    // 予約予定情報
    db.run(`create table if not exists items(${dbc.TB.ITEMS.FIELD});`);
    preSetting.items.forEach((item) => {
      console.log(
        `insert into items(${dbc.TB.ITEMS.FIELD}) values(${myValues(item)})`
      );
      db.run(
        `insert into items(${dbc.TB.ITEMS.FIELD}) values(${myValues(item)});`
      );
    });
    // 予約結果情報
    db.run(`create table if not exists results(${dbc.TB.RESULTS.FIELD});`);
    preResult.items.forEach((item) => {
      console.log(
        `insert into results(${dbc.TB.RESULTS.FIELD}) values(${myValues(item)})`
      );
      db.run(
        `insert into results(${dbc.TB.RESULTS.FIELD}) values(${myValues(
          item
        )});`
      );
    });
  });
  // } else {
  //   let aa = await select("ITEMS");
  //   console.log("aa", aa);
  // }
}
async function insert() {
  // ファイルの読み込み
  let dbc = new sqliteDb();
  const values = require("./insert.json");
  db.serialize(() => {
    // アカウント
    // let sqlstr = `insert into items(${dbc.TB.ITEMS.FIELD}) values('11/20(水)','20241120','2024/11/13','1','05:57','10号車','12D');`;
    // "date": "7/23(sui)",
    // "date_key": "20250723",
    // "book_date": "2025/7/21",
    // "check": true,
    // "time": "08:40",
    // "t_num": "1号車",
    // "s_num": "12D"
    values?.items?.forEach((val) => {
      let sqlstr = `insert into items(${dbc.TB.ITEMS.FIELD}) values('${
        val.date
      }', '${val.date_key}', '${val.book_date}', '${val.check ? "1" : "0"}', '${
        val.time
      }', '${val.t_num}', '${val.s_num}');`;
      console.log(sqlstr);
      db.run(sqlstr);
    });
  });
}
async function select() {
  // ファイルの読み込み
  let sqlstr = `select * from items order by date DESC limit 10`;

  try {
    // db.all をコールバック関数ではなくPromiseとして扱うことで、async/awaitと連携させやすくなります
    const rows = await new Promise((resolve, reject) => {
      db.all(sqlstr, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    console.log(`実行されたSQL: ${sqlstr}`);
    if (rows.length > 0) {
      console.log("--- 取得結果 ---");
      rows.forEach((row) => {
        // 各行のデータをJSON形式で出力するなど、好きな形式で標準出力できます
        console.log(JSON.stringify(row, null, 2)); // 2はインデントのスペース数
      });
    } else {
      console.log("条件に一致するデータはありませんでした。");
    }
  } catch (err) {
    console.error("クエリ実行エラー:", err.message);
  } finally {
    // データベース接続を閉じる
    db.close((err) => {
      if (err) {
        console.error("データベース切断エラー:", err.message);
      } else {
        console.log("データベース接続を閉じました。");
      }
    });
  }
}
const MODE = "migrate";
const MODE2 = "insert";
const MODE3 = "select";
// console.log(process.argv);
if (process.argv[1].indexOf("sql.js") > -1) {
  if (process.argv[2] && MODE == process.argv[2]) {
    main();
    // process.exit();
  } else if (process.argv[2] && MODE2 == process.argv[2]) {
    insert();
    // process.exit();
  } else if (process.argv[2] && MODE3 == process.argv[2]) {
    select();
  } else {
    console.log(`引数は、${MODE} だけです！`);
  }
}
// db.close();
