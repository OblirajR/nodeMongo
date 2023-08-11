const mongoose=require('mongoose')

const gamerSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    contactNumber: String,
    userType: String, 
    wishlist: [Object],
    cart: [Object]
})

module.exports.Gamer = mongoose.model("Gamer",gamerSchema)