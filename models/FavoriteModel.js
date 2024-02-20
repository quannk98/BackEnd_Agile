const mongoose = require('mongoose')
const FavoriteSchema = new mongoose.Schema({
    name_customer: String,
    name_product: String,
    img_product: String,
});

const Favorite = mongoose.model("Favorite", FavoriteSchema);
module.exports = Favorite;