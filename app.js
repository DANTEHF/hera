const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const chalk = require('chalk');
const multer = require('multer');
const session = require('express-session');
// const express-validator 可以考虑使用
const ProductType = require('./models/ProductType');
const Project = require('./models/Project');

const index = require('./controllers/index');

// 使用 ES6 的 Promise
mongoose.Promise = global.Promise;
// 连接 mongo 数据库
mongoose
  .connect('mongodb://localhost/hera')
  .then(() => {
    // 读取初始数据
    global.companyData = {};
    return ProductType.find();
  }).then(productTypes => {
    global.companyData.productTypes = productTypes;
    return Project.find();
  }).then(projects => {
    global.companyData.projects = {};
    projects.forEach(p => {
      global.companyData.projects[p.id] = p;
    });
  }).catch(err => {
    console.log(err);
  });
mongoose.connection.on('error', () => {
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'Hera God',
  cookie: {},
  resave: false,
  saveUninitialized: true
}));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
