// npm i nodemon -g
// npm init
// npm i date-fns      install date function
// npm i nodemon -D   nodeman install as dev dependency
// npm i uuid      generate different id
const http = require("http");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

const EventEmiter = require("events");
const logEvents = require("./logEvents");
class Emitter extends EventEmiter {}
// initialize the object
const myEmitter = new Emitter();
myEmitter.on('log', (msg ,fileNmae)=> logEvents(msg, fileNmae));
const PORT = process.env.PORT || 3500;

const serveFile = async (filePath, contentType, response) => {
  try {
    const rawData = await fsPromises.readFile(
      filePath,
      !contentType.includes("image") ? "utf8" : ""
    );
    const data =
      contentType === "application/json" ? JSON.parse(rawData) : rawData;
    response.writeHead(filePath.includes("404.html") ? 404 : 200, {
      "Content-Type": contentType,
    });
    response.end(
      contentType === "application/json" ? JSON.stringify(data) : data
    );
  } catch (err) {
    console.log(err);
    myEmitter.emit("log", `${err.name} : ${err.message} `, "errLog.txt");
    response.statusCode = 500;
    response.end();
  }
};

const server = http.createServer((req, res) => {
  console.log(req.url, req.method);
  myEmitter.emit("log", `${req.url}\t${req.method} `, "reqLog.txt");

  const extension = path.extname(req.url);
  console.log(extension);
  let contentType;

  switch (extension) {
    case ".thml":
      contentType = "text/html";
      break;
    case ".html":
      contentType = "text/html";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".js":
      contentType = "text/javascript";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".txt":
      contentType = "text/plain";
      break;
    case ".jpg":
    case ".jpeg":
      contentType = "image/jpeg";
      break;
    case ".png":
      contentType = "image/png";
      break;

    default:
      contentType = "text/html";
  }

  let filePath =
    contentType === "text/html" && req.url === "/"
      ? path.join(__dirname, "views", "index.thml")
      : contentType === "text/html" && req.url.slice(-1) === "/"
      ? path.join(__dirname, "views", req.url, "index.thml")
      : contentType === "text/html"
      ? path.join(__dirname, "views", req.url)
      : path.join(__dirname, req.url);

  // make .html extension not require in the browser
  if (!extension && req.url.slice(-1) !== "/") filePath += ".html";

  const fileExists = fs.existsSync(filePath);

  if (fileExists) {
    // serve the file
    serveFile(filePath, contentType, res);
    // console.log('11')
  } else {
    // 301 redirect
    console.log(path.parse(filePath).base);
    switch (path.parse(filePath).base) {
      case "index.html":
        res.writeHead(301, { Location: "/index.html" });
        res.end();
        // console.log('4')
        break;
      case "old-page.html":
        res.writeHead(301, { Location: "/new-page.html" });
        res.end();
        break;
      case "www-page.html":
        res.writeHead(301, { Location: "/" });
        res.end();
        break;
      default:
        // 404
        serveFile(path.join(__dirname, "views", "404.html"), "text/html", res);
        // console.log("default")
        break;
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});

// add listener for the log event
// myEmitter.on('log', (msg)=> logevent(msg));
// myEmitter.emit('log', 'log event emitted!');
