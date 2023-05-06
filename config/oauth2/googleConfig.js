const passport = require('passport');
const GoogleStrategy =  require( 'passport-google-oauth2' ).Strategy;


passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback   : true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    profile['state'] = request.query.state;
    return done(null, profile);
  }
));

passport.serializeUser(function(user,done){
  done(null,user);
});

passport.deserializeUser(function(user,done){
  done(null,user);
});