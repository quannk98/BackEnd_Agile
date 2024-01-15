const mongoose = require('mongoose')
const HistorySchema = new mongoose.Schema({
    name: String,
    total: Number,
    quantity: Number,
    buyer: String,
    phone: Number,
    address: String,
    images: [String],


});

const History = mongoose.model("History", HistorySchema);
module.exports = History;