  const createError = require('http-errors');
  const express = require('express');
  const path = require('path');
  const session = require('express-session');
  const app = express();
  const port = 3000;


  app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));



  app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
  });

  // Setup views
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  // Body parsing and static files
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/leaflet', express.static(path.join(__dirname, 'node_modules', 'leaflet', 'dist')));

  // Routes
  app.use('/', require('./routes/index'));
  app.use('/index', require('./routes/index'));
  app.use('/register', require('./routes/register'));
  app.use('/login', require('./routes/login'));
  app.use('/addlisting', require('./routes/addlisting'));
  app.use('/account', require('./routes/account'));
  app.use('/supplier_account', require('./routes/supplier_account'));
  app.use('/customer_dashboard', require('./routes/customer_dashboard'));
  app.use('/supplier_dashboard', require('./routes/supplier_dashboard'));
  app.use('/recycling', require('./routes/recycling'));
  app.use('/supplier_listings', require('./routes/supplier_listings'));
  app.use('/logout', require('./routes/logout'));
  app.use('/listings', require('./routes/listings'));
  app.use('/product', require('./routes/product'))
  app.use('/placeOrder', require('./routes/placeOrder'));
  app.use('/delete_product', require('./routes/delete_product'));
  app.use('/order', require('./routes/order'));
  const lokRouter = require('./routes/lok');
  app.use('/lok', lokRouter);

  
  //app.use('/delete_order', require('./routes/delete_order'));
  app.use('/supplier_order', require('./routes/supplier_order'));

  // 404 Handler
  app.use(function(req, res, next) {
    next(createError(404));
  });

  // Error Handler
  app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
  });

  // Start server
  app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port);
  });

  module.exports = app;
