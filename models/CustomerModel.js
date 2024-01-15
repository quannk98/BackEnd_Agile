const mongoose = require('mongoose')
const CustomerSchema = new mongoose.Schema({
    name: String,
    phone: Number,
    password: String,
    address: String,
    money:Number,

});

const Customer = mongoose.model("Customers", CustomerSchema);
module.exports = Customer;