const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const serveStatic = require('serve-static');

const app = express();
const server = require('http').Server(app);
const socket = require('socket.io')(server);

app.use(basicAuth({
  challenge: false,
  users: { 'admin': 'town!Hall365' }
}));
app.use(serveStatic(path.join(__dirname, 'ceo_summit_2017/public')));

let port = process.env.PORT || 1337;

server.listen(port);

console.log("Server running at http://localhost:%d", port);

socket.on('connection', (connection) => {
  let id = + new Date();
  console.log(`Socket ${id} connected.`);

  connection.on('disconnect', () => {
    console.log(`Socket ${id} disconnected.`)
  });

  connection.emit('status:update', {
    msg: 'Connected'
  });

  connection.on('message:display', (data) => {
    let { msg } = data;
    console.log(`Client ${id} says "display '${msg}'"...`);
    socket.emit('message:display', data);
  });

  connection.on('message:displayed', function(data) {
    let { msg } = data;
    socket.emit('status:update', data);
  });
});


