const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
  console.log("Nowe połączenie");

  ws.on("message", (message) => {
    // Rozsyłaj wiadomość do wszystkich połączonych
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Połączenie zakończone");
  });
});

server.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
