const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    console.error(error);
    res.redirect('/register');
  }
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true,
}));

module.exports = router;
