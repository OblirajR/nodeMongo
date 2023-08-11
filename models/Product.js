const mongoose=require('mongoose')
const productSchema = new mongoose.Schema({
    title: String,
    thumbnailURL: String,
    sellerUsername: String,
    unitsAvailable: Number,
    productType: String,
    productImages: [String],
    rentalPricePerWeek: Number,
    rentalPricePerMonth: Number
})

module.exports.Product = mongoose.model("Products", productSchema)