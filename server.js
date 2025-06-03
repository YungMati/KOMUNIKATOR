const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');

const accessCode = '1234';
const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket serwer działa');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === 'access_code') {
      ws.send(JSON.stringify({
        type: 'access_code',
        status: data.code === accessCode ? 'ok' : 'error'
      }));
    }

    if (data.type === 'login') {
      const user = users.find(u => u.username === data.username && u.password === data.password);
      ws.username = user?.username || null;
      ws.send(JSON.stringify({
        type: 'login',
        status: user ? 'ok' : 'error'
      }));
    }

    if (data.type === 'message' && ws.username) {
      const time = new Date().toLocaleTimeString();
      const message = {
        type: 'message',
        username: ws.username,
        text: data.text,
        time: time
      };

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  });
});

server.listen(3000, () => {
  console.log('Serwer nasłuchuje na porcie 3000');
});
