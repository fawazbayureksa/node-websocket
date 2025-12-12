
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080', {
  perMessageDeflate: false
});

ws.on('open', function open() {
    ws.send('Halo dari klien WebSocket!');
  console.log('Terhubung ke server WebSocket.');
});

ws.on('message', function incoming(data) {
  console.log(`Pesan diterima dari server: ${data}`);
});