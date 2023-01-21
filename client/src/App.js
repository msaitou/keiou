import "./App.css";
import React, { useEffect, useState } from "react";

function App() {
  const [contents, setContents] = useState([]);
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState([]);
  const [booking, setBooking] = useState([]);
  const [account, setAccount] = useState([]);
  const [editFlag, setEditFlag] = useState(false);
  const [isRevealPassword, setIsRevealPassword] = useState(false);

  const edit = () => {
    reqApi({ method: "GET", headers: { "Content-Type": "application/json" } }).then((res) => {
      console.log("data", res.data);
      createBookable(res.data);
      // あったらデフォ閉じる
      setOpen(!(res.data.account.id || res.data.account.password));
      setEditFlag(!editFlag);
    });
  };
  const save = () => {
    let saveData = { items: items.filter((it) => it.check), account };
    reqApi({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saveData) });
    setEditFlag(!editFlag);
  };
  const prev = () => setEditFlag(!editFlag);
  const togglePassword = () => setIsRevealPassword((prevState) => !prevState);
  const getRideTime = () => ["5:57", "6:13", "6:36", "8:40", "9:06"];
  const getTrainNum = () => {
    let trainNumList = [];
    for (let i = 1; i < 11; i++) {
      trainNumList.push(`${i}号車`);
    }
    return trainNumList;
  };
  const getSeatNum = () => {
    let seatNumList = [];
    for (let i = 1; i < 16; i++) {
      for (let a of ["A", "B", "C", "D"]) {
        seatNumList.push(`${i}${a}`);
      }
    }
    return seatNumList;
  };
  // console.log(window.location);
  var url = `http://${window.location.hostname}:3333/`;
  if (window.location.href.indexOf("https") > -1) {
    url = `https://${window.location.hostname}/api/`;
  }
  const reqApi = (paramas, query = "") => {
    return fetch(`${url}${query}`, paramas)
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        console.log("err");
      });
  };
  const createBookable = (data) => {
    let date = new Date();
    date.setDate(date.getDate() + 7);
    let dateList = [];
    let tmpItems = [];
    for (let i = 0; i < 14; i++) {
      date.setDate(date.getDate() + 1);
      if ([0, 6].indexOf(date.getDay()) > -1) continue;
      let dateStr = date.toLocaleDateString().substring(5);
      switch (date.getDay()) {
        case 1:
          dateStr += "(月)";
          break;
        case 2:
          dateStr += "(火)";
          break;
        case 3:
          dateStr += "(水)";
          break;
        case 4:
          dateStr += "(木)";
          break;
        case 5:
          dateStr += "(金)";
          break;
      }
      dateList.push(dateStr);
      // 以下　初期値（暫定　TODO）
      let newItem = { date: dateStr, check: false, time: "6:36", t_num: "3号車", s_num: "12D" };
      if (data && data.items) {
        let saved = data.items.filter((it, e) => it.date == dateStr)[0];
        if (saved) {
          newItem = saved;
          // newItem.check = newItem.check === "true" ? true : false;
        }
      }
      tmpItems.push(newItem);
    }
    setAccount({ id: data.account.id, password: data.account.password });
    setItems(tmpItems);
    // console.log("items", tmpItems, items, dateList);
  };
  const changeAccount = (e) => {
    let kind = e.target.attributes.kind.value;
    let tmp = { ...account };
    tmp[kind] = e.target.value;
    setAccount(tmp);
  };
  const changeItems = (e) => {
    // console.log(e.target.attributes.kind.value,e.target.attributes.k.value);
    // console.log("kind:"+aaa.value);
    let kind = e.target.attributes.kind.value;
    let k = e.target.attributes.k.value;
    let tmpList = [...items];
    tmpList[k][kind] = kind == "check" ? e.target.checked : e.target.value;
    setItems(tmpList);
  };
  useEffect(() => {
    reqApi({ method: "GET", headers: { "Content-Type": "application/json" } }).then((res) => {
      console.log("data", res.data);
      createBookable(res.data);
    });
    reqApi({ method: "GET", headers: { "Content-Type": "application/json" } }, "?result=1").then((res) => {
      console.log("data", res.data);
      setBooking([...res.data.items.filter((it, i) => i > res.data.items.length - 6)]);
    });
  }, [editFlag]);
  // なんか関数をかませてhtmlを描画すると変数（state）のバインドがされなくなる
  // この書き方は関数型で、もう一つコンポーネント型での書き方があるが同じ
  return (
    <div className="App">
      <h2 className="bg-dark bg-gradient text-white p-2">
        京王ライナーを朝6時に自動で予約する設定画面
        <div className="text-warning fs-6 fw-bold pt-1 mb-0" style={{ display: !editFlag ? "none" : "block" }}>
          設定の編集中です
        </div>
      </h2>
      <div className="container" style={{ padding: "10px 20px", display: editFlag ? "none" : "block" }}>
        <div className="row py-2 justify-content-center">
          <div className="col-12 border-bottom border-dark mb-2">
            <div className="row justify-content-end">
              <label className="label fw-bold col-4 mb-1">予約結果</label>
              <small className="col-4 text-left text-secondary mb-1" style={{ paddingLeft: "0px" }}>
                ※最新の5件
              </small>
            </div>
          </div>
          <div className="col-12 mb-2">
            {booking
              .filter((it) => it.check)
              .map((item, i) => (
                <div className="row pb-2 border-bottom justify-content-end" key={i}>
                  <div className="col-2 px-1">
                    <div>{item.result ? "成功" : "失敗"}</div>
                  </div>
                  <div className="col-3 px-1">
                    <div>{item.date}</div>
                  </div>
                  <div className="col-3 px-1">
                    <div>{item.time}</div>
                  </div>
                  <div className="col-4 px-1">
                    <div>
                      {item.t_num}
                      {item.s_num}
                    </div>
                  </div>
                </div>
              ))}{" "}
            <div className="col-12 text-center" style={{ display: !items.length ? "block" : "none" }}>
              まだありません
            </div>{" "}
          </div>
        </div>
        <div className="row py-2">
          <div className="col-12 border-bottom border-dark mb-2">
            <div className="row justify-content-end">
              <label className="label fw-bold col-4 mb-1">予約予定</label>
              <button className="col-4 py-0 btn-sm btn btn-primary mb-1" onClick={edit}>
                編集
              </button>
            </div>
          </div>
          <div className="col-12 mb-2">
            {items
              .filter((it) => it.check)
              .map((item, i) => (
                <div className="row pb-2 border-bottom justify-content-end" key={i}>
                  <div className="col-3 px-1">
                    <div>{item.date}</div>
                  </div>
                  <div className="col-3 px-1">
                    <div>{item.time}</div>
                  </div>
                  <div className="col-4 px-1">
                    <div>
                      {item.t_num}
                      {item.s_num}
                    </div>
                  </div>
                </div>
              ))}{" "}
            <div
              className="col-12 text-center"
              style={{ display: !items.filter((it) => it.check).length ? "block" : "none" }}
            >
              まだありません
            </div>
          </div>
        </div>
      </div>
      <div className="container" style={{ padding: "0px 20px", display: !editFlag ? "none" : "block" }}>
        <form>
          <div
            data-bs-toggle="collapse"
            data-bs-target="#collapseExample"
            role="button"
            aria-expanded="false"
            aria-controls="collapseExample"
            className="border-bottom border-dark text-start mb-2 fw-bold"
            onClick={() => setOpen((open) => !open)}
          >
            アカウント
            <span role="presentation" style={{ height: "0px", position: "relative", left: "250px", top: "0px" }}>
              {open ? <i className="fas fa-chevron-up" /> : <i className="fas fa-chevron-down" />}
            </span>
          </div>
          <div
            id="collapseExample"
            className="pb-3 "
            // style={{ display: open ? "block" : "none", transition: "0.9s display ease-out" }}
            style={{
              visibility: open ? "visible" : "hidden",
              // display: open ? "block" : "none",
              height: open ? "84px" : "0px",
              opacity: open ? 1 : 0,
              transition: "0.3s height linear, 0.3s visibility linear, 0.3s opacity linear",
            }}
          >
            <div className="row">
              <div className="col-4 text-end">
                <label htmlFor="id" className="col-form-label" kind="check">
                  ログインID
                </label>
              </div>

              <div className="col-auto">
                <input
                  type="text"
                  value={account.id}
                  className="form-control form-control-sm"
                  kind="id"
                  onChange={changeAccount}
                />
              </div>
            </div>
            <div className="row align-items-center">
              <div className="col-4 text-end">
                <label htmlFor="inputPassword6" className="col-form-label">
                  パスワード
                </label>
              </div>
              <div className="col-auto" style={{ height: "31px" }}>
                <input
                  type={isRevealPassword ? "text" : "password"}
                  value={account.password}
                  className="form-control form-control-sm"
                  aria-describedby="passwordHelpInline"
                  kind="password"
                  onChange={changeAccount}
                />
                <span onClick={togglePassword} role="presentation" className="PasswordReveal">
                  {isRevealPassword ? <i className="fas fa-eye" /> : <i className="fas fa-eye-slash" />}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="border-bottom border-dark text-start mb-2 fw-bold">
              予約予定
              <div className="text-end" style={{ float: "right" }}>
                <a
                  href="https://www.keio-ticketless.jp/keio-web/sp/top.xhtml"
                  target="_blank"
                  className="fw-light"
                  rel="noreferrer"
                >
                  <small>京王ライナーのWEBへ</small>
                </a>{" "}
              </div>
            </div>
            <div className="pb-3">
              <div className="row">
                <div className="col-7 ">
                  <label htmlFor="id" className="col-form-label">
                    乗車日時<small> (平日only)</small>
                  </label>
                </div>
                <div className="col-3">
                  <label htmlFor="id" className="col-form-label">
                    車両
                  </label>
                </div>
                <div className="col-2 px-1">
                  <label htmlFor="id" className="col-form-label">
                    座席
                  </label>
                </div>
              </div>
              <div>
                {items.map((item, i) => (
                  <div className="row pb-2" key={i}>
                    <div className="col-7 px-1">
                      <div className="input-group ">
                        <div className="input-group-text border-0 bg-white px-1">
                          <input
                            className="form-check-input mt-0"
                            type="checkbox"
                            checked={item.check}
                            kind="check"
                            k={i}
                            onChange={changeItems}
                          />
                        </div>{" "}
                        <span className="input-group-text border-0 bg-white px-1" style={{ width: "75px" }}>
                          {item.date}
                        </span>
                        <select className="form-select px-1" value={item.time} kind="time" k={i} onChange={changeItems}>
                          {getRideTime().map((time, i) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-3 px-1">
                      <select className="form-select px-1" value={item.t_num} kind="t_num" k={i} onChange={changeItems}>
                        {getTrainNum().map((ｔNum, i) => (
                          <option key={ｔNum} value={ｔNum}>
                            {ｔNum}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-2 px-1">
                      <select className="form-select px-1" value={item.s_num} kind="s_num" k={i} onChange={changeItems}>
                        {getSeatNum().map((sNum, i) => (
                          <option key={sNum} value={sNum}>
                            {sNum}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}{" "}
              </div>
            </div>
          </div>
        </form>
        <button className="col-4 py-0 btn-sm btn btn-secondary me-4" onClick={prev}>
          キャンセル
        </button>
        <button className="col-4 py-0 btn-sm btn btn-primary" onClick={save}>
          保存
        </button>
      </div>
    </div>
  );
}

export default App;
