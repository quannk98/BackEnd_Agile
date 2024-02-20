const { render } = require('ejs')
const express = require('express')
const app = express()
app.use(express.static('public'));
app.use('/Image', express.static('E:/Sever/Assignment/Image'));
const port = 3000
const bodyParser = require("body-parser");
app.use(bodyParser.json()) // cho phép đọc dữ liệu truyền từ api vào form
app.set('view engine', 'ejs')
const User = require("./models/UserModel")
const Product = require("./models/ProductModel")
const Customer = require("./models/CustomerModel")
const History = require("./models/HistoryModel");
const Cart = require("./models/CartModel");
const Favorite = require("./models/FavoriteModel")
const mongoose = require('mongoose')
const path = require('path');
const multer = require('multer');
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Loại tệp không được hỗ trợ. Vui lòng tải lên một hình ảnh.'), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Image/')
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})
const uploadImage = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 2,
    },
    fileFilter: fileFilter,
});
mongoose.connect("mongodb://127.0.0.1:27017/AppBanHang", {
    useNewUrlParser: true, useUnifiedTopology: true
})
    .then(() => {
        console.log('Kết nối tới MongoDB thành công.');
    })
    .catch((err) => {
        console.error('Lỗi khi kết nối tới MongoDB: ' + err);
    });

app.get('/home', (req, res) => {
    const relativePath = 'Screen/Home';
    res.render(relativePath);
})
app.get('/signin', (req, res) => {
    const relativePath = 'Screen/SignIn';
    res.render(relativePath);
})
app.get('/signup', (req, res) => {
    const relativePath = 'Screen/SignUp';
    res.render(relativePath);
})
app.get('/insertproduct', (req, res) => {
    const relativePath = 'Screen/InsertProduct';
    res.render(relativePath);
})
app.get('/insertcustomer', (req, res) => {
    const relativePath = 'Screen/InsertCustomer';
    res.render(relativePath);
})

app.get('/editproduct/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findById(productId)
        const relativePath = 'Screen/EditProduct';
        res.render(relativePath, { product });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }

});
app.post("/signup/User", async (req, res) => {
    const emailcheck = req.body.email
    const existingUser = await User.findOne({ email: emailcheck });
    if (existingUser) {
        res.status(400).json({ message: "Your registered account already exists" });
    }
    else {
        const newUser = new User({
            email: req.body.email,
            password: req.body.password
        });
        try {
            const result = await newUser.save();
            res.json(result)
        } catch (error) {
            console.log(error)
        }
    }

})
app.post("/signin", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;


    const user = await User.findOne({ email: email, password: password });

    if (user) {

        res.send('Đăng nhập thành công');
    } else {

        res.status(400).json({ message: "Wrong account or password" });
    }
});
app.post("/insertProduct/Product", uploadImage.array('images', 2), async (req, res) => { // link api thêm sản phẩm
    const namecheck = req.body.name;

    try {

        const existingProduct = await Product.findOne({ name: namecheck });
        if (existingProduct) {
            return res.status(400).json({ message: "Product already exists" });
        }
        if (req.files.length > 2) {
            return res.status(400).json({ message: "You can upload up to 2 images only" });
        }

        const { name, price, color, type, quantity } = req.body;
        const images = req.files.map(file => file.filename);


        const newProduct = new Product({
            name,
            price,
            color,
            type,
            images,
            quantity
        });


        const result = await newProduct.save();

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.put('/editProduct/Product/:id', uploadImage.array('images', 2), async (req, res) => { // sửa sản phẩm đã fix

    try {
        if (req.files.length > 2) {
            return res.status(400).json({ message: "You can upload up to 2 images only" });
        }
        const { name, price, color, type, quantity } = req.body;
        const images = req.files.map(file => file.filename);

        const updatedProduct = await Product.findOneAndUpdate(
            { _id: req.params.id },
            { $set: { name, price, color, type, images, quantity } },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/listproducts', async (req, res) => {
    try {
        const products = await Product.find();
        res.render("Screen/ListProduct", { products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/searchProductByName', async (req, res) => { // tìm kiếm sản phẩm
    try {
        const { name } = req.body;

        const products = await Product.find({ name: { $regex: new RegExp(name, 'i') } });

        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/deleteProduct/:id', async (req, res) => { // xóa sản phẩm đã fix
    const productId = req.params.id;
    console.log("id can xoa" + productId)

    try {

        const result = await Product.findByIdAndDelete(productId);

        if (result) {

            res.json({ message: `Product with id ${productId} deleted successfully.` });
        } else {

            res.status(404).json({ error: `Product with id ${productId} not found.` });
        }
    } catch (error) {

        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
app.delete('/deleteCart/:id', async (req, res) => {
    const cartId = req.params.id;
    console.log("id can xoa" + cartId)

    try {

        const result = await Cart.findByIdAndDelete(cartId);

        if (result) {

            res.json({ message: `Product with id ${cartId} deleted successfully.` });
        } else {

            res.status(404).json({ error: `Product with id ${cartId} not found.` });
        }
    } catch (error) {

        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
app.delete('/deleteHistory/:id', async (req, res) => {
    const historyId = req.params.id;
    console.log("id can xoa" + historyId)

    try {

        const result = await History.findByIdAndDelete(historyId);

        if (result) {

            res.json({ message: `Product with id ${historyId} deleted successfully.` });
        } else {

            res.status(404).json({ error: `Product with id ${historyId} not found.` });
        }
    } catch (error) {

        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
app.get('/listcustomers', async (req, res) => {
    try {
        const customers = await Customer.find();
        console.log(customers);
        res.render("Screen/ListCustomer", { customers });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/buyhistory', async (req, res) => { // hóa đơn
    try {
        const historys = await History.find();
        res.render("Screen/BuyHistory", { historys });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/cart', async (req, res) => { // gio hang
    try {
        const carts = await Cart.find();
        console.log(carts)
        res.render("Screen/Cart", { carts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/favorite', async (req, res) => {
    try {
        const favorites = await Favorite.find();
        console.log(favorites)
        res.render("Screen/Favorite", { favorites });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/deletefavorite/:id', async (req, res) => {
    const favoriteId = req.params.id;
    console.log("id can xoa" + favoriteId)

    try {

        const result = await Favorite.findByIdAndDelete(favoriteId);

        if (result) {

            res.json({ message: `Product with id ${favoriteId} deleted successfully.` });
        } else {

            res.status(404).json({ error: `Product with id ${favoriteId} not found.` });
        }
    } catch (error) {

        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

});
// thiết lập đường link api
app.get('/api/favorite/:name_customer', async (req, res) => {
    try {
        const name_customer = req.params.name_customer;
        const filter = name_customer ? { name_customer } : {};
        const favorites = await Favorite.find(filter);
        res.json(favorites);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post("/api/favorite", async (req, res) => {
    const name_product = req.body.name_product;
    const name_customer = req.body.name_customer;

    const existing_product = await Favorite.findOne({
        name_product: name_product,
        name_customer: name_customer,
    });
    if (existing_product) {
        res.status(400).json({ message: "Sản phẩm đã có trong danh sách yêu thích" });
    }
    else {
        const newFavorite = new Favorite({
            name_customer: req.body.name_customer,
            name_product: req.body.name_product,
            img_product: req.body.img_product,

        });
        try {
            const result = await newFavorite.save();
            res.json({ success: true, result });
        } catch (error) {
            console.log(error);
            res.json({ success: false, error });
        }
    }
});
app.delete("/api/favoritedelete/:id", async (req, res) => {
    const favoriteId = req.params.id;
    try {

        const deletedFavorite = await Favorite.findByIdAndDelete(favoriteId);

        if (deletedCart) {
            res.json({ success: true, message: 'Cart deleted successfully', deletedFavorite });
        } else {
            res.json({ success: false, message: 'Cart not found or already deleted' });
        }
    }
    catch (error) {
        console.error(error);
        res.

            status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
app.get('/api/cart/:name_customer', async (req, res) => {
    try {
        const name_customer = req.params.name_customer;
        const filter = name_customer ? { name_customer } : {};
        const carts = await Cart.find(filter);
        res.json(carts);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post("/api/cart", async (req, res) => {
    const name_product = req.body.name_product;
    const name_customer = req.body.name_customer;

    const existing_product = await Cart.findOne({
        name_product: name_product,
        name_customer: name_customer,
    });
    if (existing_product) {
        res.status(400).json({ message: "Your registered account already exists" });
    }
    else {
        const newCart = new Cart({
            id_product: req.body.id_product,
            name_customer: req.body.name_customer,
            name_product: req.body.name_product,
            price: req.body.price,
            color: req.body.color,
            type: req.body.type,
            images: req.body.images,
            quantity: req.body.quantity,
            quantity_product: req.body.quantity_product,

        });
        try {
            const result = await newCart.save();
            res.json({ success: true, result });
        } catch (error) {
            console.log(error);
            res.json({ success: false, error });
        }
    }
});

app.put("/api/cartup/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const updatedCart = await Cart.findOneAndUpdate(
            { _id: id },
            { $set: { quantity: req.body.quantity } },
            { new: true }
        );

        if (updatedCart) {
            res.json({ success: true, result: updatedCart });
        } else {
            res.status(404).json({ success: false, message: "Cart not found" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, error });
    }
});
app.delete("/api/cartdelete/:id", async (req, res) => {
    const cartId = req.params.id;
    try {

        const deletedCart = await Cart.findByIdAndDelete(cartId);

        if (deletedCart) {
            res.json({ success: true, message: 'Cart deleted successfully', deletedCart });
        } else {
            res.json({ success: false, message: 'Cart not found or already deleted' });
        }
    }
    catch (error) {
        console.error(error);
        res.

            status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/api/listproducts', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/listcustomer', async (req, res) => {
    try {
        const customer = await Customer.find();
        res.json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post("/api/listcustomer", async (req, res) => {
    const namecheck = req.body.name
    const existingCustomer = await Customer.findOne({ name: namecheck });
    if (existingCustomer) {
        res.status(400).json({ message: "Your registered account already exists" });
    }
    else {
        const newCustomer = new Customer({
            name: req.body.name,
            phone: req.body.phone,
            password: req.body.password,
            address: req.body.address,
            money: req.body.money,


        });
        try {
            const result = await newCustomer.save();
            res.json({ success: true, result });
        } catch (error) {
            console.log(error);
            res.json({ success: false, error });
        }
    }
});

app.post("/api/signin", async (req, res) => {
    try {
        const { name, password } = req.body;

        const customer = await Customer.findOne({ name, password });

        if (customer) {
            res.json({ success: true, message: 'Đăng nhập thành công' });
        } else {
            res.status(401).json({ success: false, message: 'Đăng nhập thất bại' });
        }
    } catch (error) {
        console.error('Lỗi khi xử lý yêu cầu đăng nhập:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
app.get('/api/product/:name', async (req, res) => {
    const customerName = req.params.name;

    try {

        const product = await Product.findOne({ name: customerName });

        if (product) {

            res.json({ success: true, product });
        } else {

            res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu sản phẩm:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
app.get('/api/customer/:name', async (req, res) => {
    const customerName = req.params.name;

    try {

        const customer = await Customer.findOne({ name: customerName });

        if (customer) {

            res.json({ success: true, customer });
        } else {

            res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu khách hàng:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
app.put('/api/customer/:name', async (req, res) => {
    const customerName = req.params.name;

    try {
        const { phone, password, address, money } = req.body;

        const updatedCustomer = await Customer.findOneAndUpdate(
            { name: customerName },
            { $set: { phone, password, address, money } },
            { new: true }
        );

        if (updatedCustomer) {
            res.json({ success: true, customer: updatedCustomer });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin khách hàng:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});
app.get('/api/buyhistory/:buyer', async (req, res) => {
    try {
        const buyer = req.params.buyer;
        const filter = buyer ? { buyer } : {};
        const historys = await History.find(filter);
        res.json(historys);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post("/api/buyhistory", async (req, res) => {
    try {
        const { name, quantity, total, buyer } = req.body;


        const product = await Product.findOne({ name: name });

        if (!product || product.quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Sản phẩm không đủ để mua' });
        }


        const customer = await Customer.findOne({ name: buyer });

        if (!customer || customer.money < total) {
            return res.status(400).json({ success: false, message: 'Khách hàng không đủ tiền để mua' });
        }


        const updatedProduct = await Product.findOneAndUpdate(
            { name: name },
            { $inc: { quantity: -quantity } },
            { new: true }
        );

        const updatedCustomer = await Customer.findOneAndUpdate(
            { name: buyer },
            { $inc: { money: -total } },
            { new: true }
        );


        const newHistory = new History({
            name: name,
            total: total,
            quantity: quantity,
            buyer: buyer,
            phone: customer.phone,
            address: customer.address,
            images: product.images,
        });
        if (updatedCustomer && updatedProduct) {

            const result = await newHistory.save();


            res.json({ success: true, history: result });
        } else {
            console.log('Không tìm thấy khách hàng và sản phẩm để cập nhật.');
        }


    } catch (error) {
        console.error('Lỗi khi xử lý lịch sử mua hàng:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});



// thiết lập cổng cho server
app.listen(port, () => {
    console.log(`server running at the port ${port}`)
})