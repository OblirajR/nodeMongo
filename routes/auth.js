const express = require('express')
const router= express.Router()
const {Seller} = require('../models/Seller')
const {Gamer}=require('../models/Gamer')
const {Product} = require('../models/Product') 

//LOGIN
router.post('/login',async(req,res,next)=>{
        const { username, password } = req.body;
    try {
        let user = await Seller.findOne({username})
        if(!user){
          user= await Gamer.findOne({username})
        }
        if(!user){
          return res.status(400).json({message:"Invalid login credentials username"})
        }
        if(password!==user.password){
          return res.status(400).json({message:"Invalid Login credentials password"})
        }
        return res.status(200).json({userId: user._id,message:"Login successful "})
    } catch (error) {
      console.log(error)
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});


// REGISTER
router.post('/register', async (req, res) => {
    
        const { username, email, password,firstName,lastName,contactNumber, userType } = req.body;
    
        if(!email){
          return res.status(400).json({error:"Please provide email"})
        }
        else if(!username){
          return res.status(400).json({error:"Please provide username"})
        }
        else if(!firstName){
          return res.status(400).json({error:"Please provide firstname"})
        }
        else if(!lastName){
          return res.status(400).json({error:"Please provide lastname"})
        }
        else if(!contactNumber){
          return res.status(400).json({error:"Please provide contactnumber"})
        }
        else if(!password){
          return res.status(400).json({error:"Please provide password"})
        }
        else if(!userType){
          return res.status(400).json({error:"Please provide usertype"})
        }
        
        if (userType === 'Seller' && !email.endsWith('@admin.com')) {
          return res.status(400).json({ message: 'Sellers can only register with admin domain' });
        }
      
        try {
          let newUser;
      
          if (userType === 'Seller') {
            newUser = new Seller(req.body);
          } else if (userType === 'Gamer') {
            newUser = new Gamer(req.body);
          }
          const savedUser = await newUser.save();
          return res.status(200).json({message:"registered successfully",savedUser});
        } catch (error) {
          console.log(error)
          return res.status(400).json({ message: 'Error registering user' });
        }
 });


//HOMEPAGE API
 router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({}, '-productImages'); 
    res.status(200).json(products);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error fetching products' });
  }
});

//PRODUCT DETAILS
router.get('/products/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findOne({_id:productId});
    if (!product) {
      return res.status(404).json({ message: 'Product Not Found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error fetching product details' });
  }
});


//SAVE AND REMOVE 
router.put('/wishlist', async (req, res) => {
  const { userID, productID } = req.body;

  try {
    const user = await Gamer.findById(userID);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const product = await Product.findById(productID);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productIndex = user.wishlist.findIndex(item => item.toString() === productID);
    if (productIndex === -1) {
      user.wishlist.push(productID);
      await user.save();
    } else {
      user.wishlist.splice(productIndex, 1);
      await user.save();
    }
    const updatedWishlist = await Promise.all(
      user.wishlist.map(async productId => {
        const product = await Product.findById(productId, '-productImages');
        return {
          productID: product._id,
          title: product.title,
          thumbnailURL: product.thumbnailURL,
          sellerUsername: product.sellerUsername,
          unitsAvailable: product.unitsAvailable,
          productType: product.productType,
          rentalStartingFromPrice: product.rentalPricePerWeek,
        };
      })
    );

    res.status(200).json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: 'Error saving/removing from wishlist' });
  }
});


//ADD AND REMOVE
router.put('/cart', async (req, res) => {
  const { userID, productID, count, bookingStartDate, bookingEndDate } = req.body;

  try {
    const user = await Gamer.findById(userID);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const product = await Product.findById(productID);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (count > product.unitsAvailable) {
      return res.status(400).json({ message: `Only ${product.unitsAvailable} units available` });
    }

    const cartItemIndex = user.cart.findIndex(item => item.product.toString() === productID);
    if (cartItemIndex === -1) {
      user.cart.push({
        product: productID,
        count,
        bookingStartDate,
        bookingEndDate,
      });
      await user.save();
    } else {
      user.cart[cartItemIndex].count = count;
      user.cart[cartItemIndex].bookingStartDate = bookingStartDate;
      user.cart[cartItemIndex].bookingEndDate = bookingEndDate;
      await user.save();
    }
    const updatedCart = await Promise.all(
      user.cart.map(async cartItem => {
        const product = await Product.findById(cartItem.product, '-productImages');
        const rentedAtPrice = `${product.rentalPricePerWeek}/week, ${product.rentalPricePerMonth}/month`;
        return {
          productID: product._id,
          title: product.title,
          thumbnailURL: product.thumbnailURL,
          sellerUsername: product.sellerUsername,
          count: cartItem.count,
          unitsAvailable: product.unitsAvailable,
          productType: product.productType,
          bookingStartDate: cartItem.bookingStartDate,
          bookingEndDate: cartItem.bookingEndDate,
          rentedAtPrice,
        };
      })
    );
    res.status(200).json(updatedCart);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error adding/removing from cart' });
  }
});



//PLACE ORDER
router.post('/place-order', async (req, res) => {
  const { userID } = req.body;

  try {
    const user = await Gamer.findById(userID);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const orderedProducts = [];

    for (const cartItem of user.cart) {
      const product = await Product.findById(cartItem.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found for cart item: ${cartItem.product}` });
      }

      if (cartItem.count > product.unitsAvailable) {
        return res.status(400).json({ message: `Only ${product.unitsAvailable} units available for product: ${product.title}` });
      }

      product.unitsAvailable -= cartItem.count;
      await product.save();

      orderedProducts.push({
        productID: product._id,
        title: product.title,
        thumbnailURL: product.thumbnailURL,
        sellerUsername: product.sellerUsername,
        unitsAvailable: product.unitsAvailable,
        productType: product.productType,
        bookingStartDate: cartItem.bookingStartDate,
        bookingEndDate: cartItem.bookingEndDate,
        rentedAtPrice: `${product.rentalPricePerWeek}/week, ${product.rentalPricePerMonth}/month`,
      });
    }

    user.cart = [];
    await user.save();

    res.status(200).json(orderedProducts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error placing order' });
  }
});



//VIEW USER DETAILS
router.get('/user/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await Gamer.findOne({ username }, '-password'); 

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const responseData = {
      userID: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      userType: user.userType,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error fetching user details' });
  }
});



//UPDATE USER
router.put('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { firstName, lastName, email, contactNumber, userType } = req.body;

  try {
    const gamer = await Gamer.findById(userId);
    const seller = await Seller.findById(userId);

    if (!gamer && !seller) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (gamer) {
      gamer.firstName = firstName;
      gamer.lastName = lastName;
      gamer.email = email;
      gamer.contactNumber = contactNumber;
      await gamer.save();
    } else {
      seller.firstName = firstName;
      seller.lastName = lastName;
      seller.email = email;
      seller.contactNumber = contactNumber;
      await seller.save();
    }

    const updatedUser = gamer || seller;
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error updating user details' });
  }
});



//CREATE PRODUCT
router.post('/create-product', async (req, res) => {
  const {title,thumbnailURL,sellerUsername,unitsAvailable,productType,productImages,rentalPricePerWeek,rentalPricePerMonth} = req.body;

  try {
    const newProduct = new Product({
      title,
      thumbnailURL,
      sellerUsername,
      unitsAvailable,
      productType,
      productImages,
      rentalPricePerWeek,
      rentalPricePerMonth
    });

    const savedProduct = await newProduct.save();

    res.status(200).json({
      productID: savedProduct._id,
      title: savedProduct.title,
      thumbnailURL: savedProduct.thumbnailURL,
      sellerUsername: savedProduct.sellerUsername,
      unitsAvailable: savedProduct.unitsAvailable,
      productType: savedProduct.productType,
      productImages: savedProduct.productImages,
      rentalPricePerWeek: savedProduct.rentalPricePerWeek,
      rentalPricePerMonth: savedProduct.rentalPricePerMonth
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating product' });
  }
});



//UPDATE PRODUCT
router.put('/update-product/:id', async (req, res) => {
  const { id } = req.params;
  const {title,thumbnailURL,sellerUsername,unitsAvailable,productType,productImages,rentalPricePerWeek,rentalPricePerMonth} = req.body;

  try {
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.title = title;
    product.thumbnailURL = thumbnailURL;
    product.sellerUsername = sellerUsername;
    product.unitsAvailable = unitsAvailable;
    product.productType = productType;
    product.productImages = productImages;
    product.rentalPricePerWeek = rentalPricePerWeek;
    product.rentalPricePerMonth = rentalPricePerMonth;

    const updatedProduct = await product.save();
    res.status(200).json({
      productID: updatedProduct._id,
      title: updatedProduct.title,
      thumbnailURL: updatedProduct.thumbnailURL,
      sellerUsername: updatedProduct.sellerUsername,
      unitsAvailable: updatedProduct.unitsAvailable,
      productType: updatedProduct.productType,
      productImages: updatedProduct.productImages,
      rentalPricePerWeek: updatedProduct.rentalPricePerWeek,
      rentalPricePerMonth: updatedProduct.rentalPricePerMonth
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error updating product' });
  }
});






module.exports=router
