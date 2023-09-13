const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/User'); // Import your User model
const bcrypt = require('bcrypt');

// Configure the LocalStrategy for authentication
passport.use(
  new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
      // Find a user with the given email
      const user = await User.findOne({ email });

      // If the user does not exist, or the password is incorrect
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return done(null, false, { message: 'Incorrect email or password.' });
      }

      // If authentication is successful, return the user object
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});
