const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const userRouter = require('./routes/auth')


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',(req,res)=>{
    res.send("Hello World")
})


app.use((error,req,res,next)=>{
    res.status(500).json({message: error.message,data: error.data})
})
app.use('/api',userRouter)

mongoose.connect('mongodb+srv://obliraj700:admin124@cluster0.lvnsez8.mongodb.net/gamerApp?retryWrites=true&w=majority',{
    useNewUrlParser : true,
    useUnifiedTopology: true
})
.then(()=>{console.log("Database Connected Succesfully")})
.catch(err => console.log(err))

app.listen(5001,()=>{
    console.log("Server running on port No. 5001")
})
