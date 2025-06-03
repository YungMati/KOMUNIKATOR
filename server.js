const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const accessCode = 'ZAQ!2wsx';
const users = {
  'yung': '1234',
  'czarny': '1234'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  let ext = path.extname(filePath);
  let contentType = {
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html'
  }[ext] || 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

const wss = new WebSocket.Server({ server });
let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    switch (data.type) {
      case 'access_code':
        ws.send(JSON.stringify({ type: 'access_code', status: data.code === accessCode ? 'ok' : 'error' }));
        break;

      case 'login':
        const valid = users[data.username] === data.password;
        ws.username = valid ? data.username : null;
        ws.send(JSON.stringify({ type: 'login', status: valid ? 'ok' : 'error' }));
        break;

      case 'message':
        if (!ws.username) return;
        const msg = {
          type: 'message',
          username: ws.username,
          text: data.text,
          time: new Date().toLocaleTimeString()
        };
        clients.forEach(client => client.readyState === WebSocket.OPEN && client.send(JSON.stringify(msg)));
        break;
    }
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
