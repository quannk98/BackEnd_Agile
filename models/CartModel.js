const mongoose = require('mongoose')
const CartSchema = new mongoose.Schema({
    id_product: String,
    name_customer: String,
    name_product: String,
    price: Number,
    color: String,
    type: String,
    images: [String],
    quantity: Number,
    quantity_product: Number,

});

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;