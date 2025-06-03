const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

const ACCESS_CODE = 'ZAQ!2wsx';
const USERS = {
  'yung': '1234',
  'czarny': '1234'
};

let savedMessages = [];

app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', ws => {
  let loggedUser = null;

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'access') {
        ws.send(JSON.stringify({ type: 'access', ok: data.code === ACCESS_CODE }));

      } else if (data.type === 'login') {
        const { username, password } = data;
        if (USERS[username] === password) {
          loggedUser = username;
          ws.send(JSON.stringify({ type: 'login', ok: true }));
          ws.send(JSON.stringify({ type: 'history', messages: savedMessages }));
        } else {
          ws.send(JSON.stringify({ type: 'login', ok: false }));
        }

      } else if (data.type === 'message' && loggedUser) {
        const message = { username: loggedUser, text: data.text };
        savedMessages.push(message);
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'message', ...message }));
          }
        });
      }
    } catch (err) {
      console.error('Błąd JSON:', err);
    }
  });
});

server.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
