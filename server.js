const WebSocket = require('ws');
const http = require('http');
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const ACCESS_CODE = 'ZAQ!2wsx';
const USERS = {
  'yung': '1234',
  'czarny': '1234'
};

wss.on('connection', (ws) => {
  ws.isVerified = false;
  ws.isLoggedIn = false;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (!ws.isVerified && data.type === 'access_code') {
        if (data.code === ACCESS_CODE) {
          ws.isVerified = true;
          ws.send(JSON.stringify({ type: 'access_code', status: 'ok' }));
        } else {
          ws.send(JSON.stringify({ type: 'access_code', status: 'error' }));
        }
        return;
      }

      if (ws.isVerified && !ws.isLoggedIn && data.type === 'login') {
        if (USERS[data.username] === data.password) {
          ws.username = data.username;
          ws.isLoggedIn = true;
          ws.send(JSON.stringify({ type: 'login', status: 'ok' }));
        } else {
          ws.send(JSON.stringify({ type: 'login', status: 'error' }));
        }
        return;
      }

      if (ws.isVerified && ws.isLoggedIn && data.type === 'message') {
        const time = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        const payload = JSON.stringify({
          type: 'message',
          username: ws.username,
          text: data.text,
          time
        });
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN && client.isLoggedIn) {
            client.send(payload);
          }
        });
      }
    } catch (e) {
      console.error('Błąd parsowania wiadomości:', e);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Serwer WebSocket działa na porcie ${PORT}`);
});
