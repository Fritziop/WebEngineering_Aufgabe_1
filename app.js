const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const basicAuth = require('basic-auth-connect');
const swaggerUi = require('swagger-ui-express');
const fs = require("fs")
const YAML = require('yaml')
const file  = fs.readFileSync('./swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)

const model = require('./model');
class User {
  constructor(name, passwd) {
    this.name = name;
    /* eindeutige ID*/
    this.passwd = passwd;
  }
}
const localUsers = [ new User("Max", "maxi"), new User("Moritz", "moritzi"), new User("Lempel", "lempeli")] ;
model.createModel(localUsers);

const personRouter = require('./routes/person');
const positionRouter = require('./routes/position');
const doorRouter = require('./routes/door');

const app = express();

/**
 * aktiviere einfache Authentifizierung
 */
app.use(basicAuth(function (user, pass) {
  // Authentifizierung OK, wenn daten zu einem Nutzer passen
  for (let localUser of localUsers) {
    if (user == localUser.name && pass == localUser.passwd) {
      return true;
    }
  }
  return false;
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/person', personRouter);
app.use('/api/position', positionRouter);
app.use('/api/door', doorRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
