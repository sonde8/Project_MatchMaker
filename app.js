require("dotenv").config();
console.log(process.env.CUSTOMKEY);
const express = require("express");
const app = express();
const nunjucks = require("nunjucks");
const session = require("express-session");
const fileStore = require("session-file-store")(session);
const path = require("path"); // path 모듈 추가
const conn = require("./config/DB.js");
const WebSocket = require("ws");
const fs = require('fs');



// 뷰 엔진 설정
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
nunjucks.configure("views", {
  express: app,
  watch: true,
});

// 기본 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 설정
app.use(express.static(path.join(__dirname, 'public')));

// 정적 파일 제공 설정 (기본 프로필 이미지 접근 가능)
app.use('/img', express.static(path.join(__dirname, 'img')));

const sessionDir = path.join(__dirname, 'sessions');


if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}



// 세션 스토어 설정
const sessionStore = new fileStore({
  path: sessionDir,
  retries: 1, // 재시도 횟수
  retryDelay: 7000, // 재시도 지연 시간 (밀리초)
  logFn: function (error) {
    console.error("세션 재로딩중~ 걱정 말아유 ~ ");
  }
});

app.use(
  session({
    store: sessionStore,
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  
  })
);


// 라우터 설정
const mainRouter = require("./routes/mainrouter");
const userRouter = require("./routes/userrouter");
const reservRouter = require("./routes/reservRouter");
const balRouter = require("./routes/balRouter");
const manageRouter = require("./routes/manageRouter.js");
const uploadRouter = require('./routes/uploadRouter.js'); 
const bossuploadRouter = require('./routes/bossuploadRouter.js'); 

app.use("/", mainRouter);
app.use("/user", userRouter);
app.use("/reserv", reservRouter);
app.use("/bal", balRouter);
app.use("/manage", manageRouter);


// 업로드 라우터 추가
app.use('/api', uploadRouter);
app.use('/api/boss', bossuploadRouter);


// 아이디 중복 확인 API
app.post("/check-username", (req, res) => {
  const { username } = req.body;
  const query = "SELECT * FROM user_info WHERE user_id = ?";

  conn.query(query, [username], (error, results) => {
    if (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "서버 오류" });
    } else {
      res.json({ exists: results.length > 0 });
    }
  });
});

// 서버와 WebSocket 서버를 함께 실행
const server = app.listen(3007, () => {
  
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  

  ws.on("message", (message) => {
    // 모든 클라이언트에게 메시지 전송
    const msg = message.toString();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    
  });
});
