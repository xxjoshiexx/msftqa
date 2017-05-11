const express = require('express');
const basicAuth = require('express-basic-auth');
const path = require('path');
const serveStatic = require('serve-static');

const app = express();

app.use(basicAuth({
  challenge: true,
  users: { 'admin': 'town!Hall365' }
}));
app.use(serveStatic(path.join(__dirname, 'ceo_summit_2017/public')));
app.listen(3001);
