const mongoose=require('mongoose')

const sellerSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    contactNumber: String,
    userType: String, 
})

module.exports.Seller = mongoose.model("Seller",sellerSchema)