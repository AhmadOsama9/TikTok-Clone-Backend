const  FacebookStrategy = require('passport-facebook').Strategy;
const passport = require("passport");

passport.use(
    new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_APP_ID,
            clientSecret: process.env.FACEBOOK_APP_SECRET,
            callbackURL: "/api/auth/facebook/callback",
            passReqToCallback: true,
            profileFields: ['id', 'displayName', 'email']
        },
        function(accessToken, refreshToken, profile, done) {
            return done(null, { profile, accessToken });
        }
));


module.exports = passport;
