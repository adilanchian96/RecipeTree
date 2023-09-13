const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentRecipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }, // Reference to the parent recipe
});

// Export the Recipe model
module.exports = mongoose.model('Recipe', recipeSchema);
