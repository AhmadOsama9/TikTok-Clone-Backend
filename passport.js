const FacebookStrategy = require('passport-facebook-oauth20').Strategy;

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "localhost:3000/api/auth/facebook/callback",
    passReqToCallback: true,
  },
  async function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
  }
));

module.exports = passport;