const express = require('express');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport'); // Remove the './passport' import
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const User = require('./models/User');
const Recipe = require('./models/recipe.js'); // Import the Recipe model
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const path = require('path'); // Import path module

const app = express();
const connectionString = require('./mongodb').connString; // This is a secret file. Fill it with your own connection string

// Generate a random secure secret key
const generateSecretKey = () => {
  return require('crypto').randomBytes(64).toString('hex');
};
const secretKey = process.env.SESSION_SECRET || generateSecretKey();

// Connect to MongoDB
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Specify the directory where your EJS templates are located
app.set('views', path.join(__dirname, 'views'));

// Specify the public static assets
app.use(express.static('public'));


// Configure session with the generated secret key
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport and set up session management
app.use(passport.initialize());
app.use(passport.session());

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

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Middleware for flash messages (for displaying notifications)
app.use(flash());

// Middleware for parsing incoming data in request bodies
app.use(express.urlencoded({ extended: false }));

// Protect certain pages behind authentication.
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.get('/my-account', isAuthenticated, async (req, res) => {
  const recipes = await Recipe.find({user:req.user._id});
  res.render('my-account', {recipes});
});

app.get('/my-branched-recipe', isAuthenticated, async (req, res) => {
  try {
    // Find recipes where the user's _id is the parentRecipe
    const branchedRecipes = await Recipe.find({ parentRecipe: req.user._id });

    res.render('my-branched-recipe', { branchedRecipes });
  } catch (error) {
    console.error(error);
    res.redirect('/'); // Redirect to the dashboard or handle errors as needed
  }
});

app.get('/', (req, res) => {
  res.render('index', { messages: req.flash() });
});

// Define routes for login, registration, and my account
app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash(), email: req.flash('error')[0] });
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/', // Redirect to the home page on success
  failureRedirect: '/login', // Redirect to login on failure
  failureFlash: true, // Enable flash messages on failure
  successFlash: true, // Enable flash messages on success
  badRequestMessage: 'Invalid email or password.', // Custom error message
}));

app.get('/register', (req, res) => {
  // Render the register.ejs template and pass flash messages as data
  res.render('register', { messages: req.flash() });
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      req.flash('error', 'Email already in use.');
      return res.redirect('/register');
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new user with only email
    const newUser = new User({
      email: email,
      password: hashedPassword,
    });

    await newUser.save();
    req.flash('success', 'Registration successful.');
    res.redirect('/login');
  } catch (error) {
    req.flash('error', 'Registration failed.');
    res.redirect('/register');
  }
});

// Route to handle the form submission and create a new recipe
app.post('/recipes', async (req, res) => {
  try {
    const { name, ingredients, instructions } = req.body;

    // Create a new recipe using the Recipe model
    const newRecipe = new Recipe({
      title: name,
      ingredients: ingredients,
      instructions: instructions,
      user: req.user._id,
      parentRecipe: req._id, // Set the recipe ID
    });

    // Save the new recipe to the database
    await newRecipe.save();

    // Redirect to the dashboard or "my branched recipes" after creating the recipe
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.redirect('/recipes/new'); // Redirect back to the form with an error message
  }
});

// Define routes for recipes
app.use('/recipes', recipeRoutes); // Mount the recipe routes under the '/recipes' path



app.get('/logout', function(req, res) {
  delete req.session.auth;
  req.logout(() => {}); // Passport.js function to log the user out
  req.flash('success', 'Logged out successfully')
  res.redirect('/');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
