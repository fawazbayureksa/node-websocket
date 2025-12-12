// index.js

const WebSocket = require('ws');

// Inisialisasi Server WebSocket
// Server akan berjalan pada port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('Server WebSocket berjalan pada ws://localhost:8080');
console.log('Menunggu koneksi klien...');

// 1. Event: 'connection'
// Dipicu setiap kali klien baru berhasil terhubung ke server.
wss.on('connection', function connection(ws) {
    // console.log('Klien baru terhubung!');
    
    // Kirim pesan selamat datang segera setelah koneksi
    ws.send('Selamat datang di Server WebSocket Sederhana!');

    // 2. Event: 'message'
    // Dipicu ketika server menerima pesan dari klien yang terhubung.
    ws.on('message', function incoming(message) {
        // Karena data dari klien biasanya berupa Buffer, kita konversi ke String
        const messageString = message.toString();
        
        console.log(`Pesan diterima dari klien: ${messageString}`);
        
        // Contoh Balasan Otomatis:
        const response = `Anda mengirim: "${messageString}". Terima kasih!`;
        ws.send(response); // Mengirim balasan hanya ke klien yang mengirim pesan
        
        // --- Contoh Broadcasting (Kirim ke Semua Klien) ---
        // Jika Anda ingin mengirim pesan ke semua klien yang terhubung:
        /*
        //    wss.clients.forEach(function each(client) {
        //        // Pastikan klien dalam keadaan OPEN sebelum mengirim
        //        if (client.readyState === WebSocket.OPEN) {
        //            client.send(`Pesan BARU dari klien: ${messageString}`);
        //        }
        //    });
        */
    });

    // 3. Event: 'close'
    // Dipicu ketika klien memutuskan koneksi.
    ws.on('close', function close() {
        console.log('Klien terputus.');
    });

    // 4. Event: 'error'
    // Dipicu jika terjadi error pada koneksi.
    ws.on('error', function error(err) {
        console.error('Terjadi error:', err);
    });
});