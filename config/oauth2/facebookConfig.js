const passport = require('passport');
const FacebookStrategy =  require( 'passport-facebook' ).Strategy;


passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id','displayName','name','gender','email','birthday'],
    passReqToCallback: true,
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