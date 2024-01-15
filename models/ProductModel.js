const mongoose = require('mongoose')
const ProductSchema = new mongoose.Schema({
    name: String,
    price: Number,
    color: String,
    type: String,
    images: [String],
    quantity: Number

});

const Product = mongoose.model("Products", ProductSchema);
module.exports = Product;