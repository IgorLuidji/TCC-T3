require('dotenv').config();
const express = require("express")
const exphbs = require('express-handlebars')
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const flash = require("express-flash");
const path = require('path');

const app = express();

const conn = require("./db/conn");

// routes
const authRoutes = require("./routes/authRoutes");
const indexRoutes = require("./routes/indexRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");
const congressRoutes = require("./routes/congressRoutes");
const eventRoutes = require("./routes/eventRoutes");
const eventPublicRoutes = require("./routes/eventPublicRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const passport = require('passport');

app.engine('handlebars', exphbs.engine({defaultLayout: "main"}));
app.set('view engine', 'handlebars');

app.use(
  express.urlencoded({
    extended: true
  })
)


app.use(express.json());


//session middleware
const middlewares = [
  session({
    name: 'session',
    secret: 'i21S9c3W!C#F2lxZ0CYtc8Z#',
    resave: false,
    saveUninitialized: false,
    store: new FileStore({
      logFn: function () {},
      path: path.resolve("./sessions"),
    }),
    cookie: {
      secure: false,
      resave: true,
      maxAge: (3600000*24),
      httpOnly: true,
    },
  }),
  flash()
];

app.use(middlewares);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'))

app.use((req, res, next) => {
  if (req.session && req.session.userid) {
    res.locals.session = req.session;
  }
  next();
});

app.use("/", authRoutes);
app.use("/", indexRoutes);
app.use("/perfil", profileRoutes);
app.use("/usuario", userRoutes);
app.use("/congresso", congressRoutes);
app.use("/meus-eventos", eventRoutes);
app.use("/eventos", eventPublicRoutes);
app.use("/relatorios", reportsRoutes);
app.get('*', function(req, res){
  res.render('communs/404', {layout: 'error' });
});

app.use((err,req, res, next) => {
  console.log(err)
  res.render('communs/500', {layout: 'error' });
});

conn
  .sync(
    // {force: true}
  )
  .then(() => {
    app.listen(process.env.PORT);
  })
  .catch((err) => console.log(err));