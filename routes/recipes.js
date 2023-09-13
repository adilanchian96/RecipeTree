const express = require('express');
const Recipe = require('../models/recipe.js');
const auth = require("../app.js");
const router = express.Router();

// Existing routes...

// Route to display the "create new recipe" form
router.get('/new', function(req, res) {
  if (!req.isAuthenticated()) {
      res.redirect('/login');
  } else {
      console.log(req.user._id);
      res.render('create-recipe');
  }
});

router.post('/delete', async function(req, res){
  const recipeId = req.body.recipeId;
  await Recipe.deleteOne({_id:recipeId, user:req.user._id});
  res.redirect('/my-account');
});

router.get('/branch/:recipeId', async (req, res) => {
  try {
    const parentRecipe = await Recipe.findById(req.params.recipeId);

    if (!parentRecipe) {
      return res.redirect('/'); // Handle recipe not found
    }

    res.render('branch-recipe', { parentRecipe });
  } catch (error) {
    console.error(error);
    res.redirect('/'); // Redirect or handle errors as needed
  }
});

// Route to handle the form submission and create a branched recipe
router.post('/branch', async (req, res) => {
  try {
    const { ingredients, instructions, parentRecipe } = req.body;

    // Create a new branched recipe using the Recipe model  
    const branchedRecipe = new Recipe({
      title: 'Branched Recipe', // You can set a default title or prompt the user for a title
      ingredients: ingredients,
      instructions: instructions,
      parentRecipe: parentRecipe, // Reference to the parent recipe
      user: req.user._id, // Associate the branched recipe with the logged-in user
    });

    // Save the branched recipe to the database
    await branchedRecipe.save();

    res.redirect('/'); // Redirect after creating the branched recipe
  } catch (error) {
    console.error(error);
    res.redirect('/'); // Redirect or handle errors as needed
  }
});

module.exports = router;
