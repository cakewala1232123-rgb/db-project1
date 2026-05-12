const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server config
const config = {
    user: "myuser",
    password: "mypassword123",
    server: "localhost",
    port: 1433,
    database: "project",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// Connect once
let pool;

async function connectDB() {
    try {
        pool = await sql.connect(config);
        console.log("Connected to SQL Server");
    } catch (err) {
        console.error("DB connection failed:", err);
    }
}

connectDB();

// ============================================
// AUTH ROUTES
// ============================================

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password required"
        });
    }

    try {
        const request = pool.request();
        request.input("email", sql.VarChar(100), email);
        request.input("password", sql.VarChar(100), password);

        const result = await request.execute("LoginUser");

        if (result.recordset.length === 0) {
            return res.json({
                success: false,
                message: "Invalid email or password"
            });
        }

        res.json({
            success: true,
            message: "Login successful",
            userId: result.recordset[0].id
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({
            success: false,
            message: "Login Failed"
        });
    }
});

app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: "Email and password required" 
        });
    }

    try {
        const request = pool.request();
        request.input("email", sql.VarChar(100), email);
        request.input("password", sql.VarChar(100), password);

        await request.execute("InsertUser"); // FIXED: was RegisterUser

        res.json({
            success: true,
            message: "User registered successfully"
        });

    } catch (err) {
        console.error("Registration error:", err);
        
        // Check for duplicate email
        if (err.originalError && err.originalError.message.includes('UNIQUE')) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Registration Failed"
        });
    }
});

// ============================================
// PROFILE ROUTES
// ============================================

app.get("/profile/:id", async (req, res) => {
    try {
        const request = pool.request();
        request.input("userId", sql.Int, parseInt(req.params.id));
        const result = await request.execute("GetUserProfile");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            userdetails: result.recordset[0]
        });

    } catch (err) {
        console.error("Profile fetch error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
});

app.post("/update-profile", async (req, res) => {
    const { fname, lname, phone, pfp, add_wallet, userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    try {
        const request = pool.request();

        request.input("fname", sql.VarChar(100), fname || "");
        request.input("lname", sql.VarChar(100), lname || "");
        request.input("phone", sql.VarChar(100), phone || "");
        request.input("pfp", sql.VarChar(255), pfp || "");
        request.input("add_wallet", sql.Decimal(10, 2), add_wallet ? parseFloat(add_wallet) : 0);
        request.input("userId", sql.Int, parseInt(userId));

        await request.execute("UpdateProfile");

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (err) {
        console.error("Update profile error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
});

// ============================================
// PRODUCT ROUTES
// ============================================

app.post("/add-product", async (req, res) => {
    const {
        ProductName,
        Description,
        Price,
        Quantity,
        ImageURL,
        SellerID,
        CategoryID
    } = req.body;

    if (!ProductName || !Price || !Quantity || !SellerID || !CategoryID) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    try {
        const request = pool.request();

        request.input("ProductName", sql.VarChar(200), ProductName);
        request.input("Description", sql.VarChar(1000), Description || "");
        request.input("Price", sql.Decimal(10, 2), parseFloat(Price));
        request.input("Quantity", sql.Int, parseInt(Quantity));
        request.input("ImageURL", sql.VarChar(500), ImageURL || "");
        request.input("SellerID", sql.Int, parseInt(SellerID));
        request.input("CategoryID", sql.Int, parseInt(CategoryID));

        await request.execute("AddProduct");

        res.json({
            success: true,
            message: "Product added successfully"
        });

    } catch (err) {
        console.error("Add product error:", err);
        res.status(500).json({
            success: false,
            message: "Product insertion failed"
        });
    }
});

app.post("/remove-product", async (req, res) => {
    const { ProductID } = req.body;

    if (!ProductID) {
        return res.status(400).json({
            success: false,
            message: "Product ID is required"
        });
    }

    try {
        const request = pool.request();
        request.input("ProductID", sql.Int, parseInt(ProductID));

        await request.execute("RemoveProduct");

        res.json({
            success: true,
            message: "Product removed successfully"
        });

    } catch (err) {
        console.error("Remove product error:", err);
        res.status(500).json({
            success: false,
            message: "Product removal failed"
        });
    }
});

app.get("/view-products", async (req, res) => {
    const categoryId = parseInt(req.query.categoryId) || 0;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 999999;
    const search = req.query.search || "";

    try {
        const request = pool.request();

        request.input("CategoryID", sql.Int, categoryId);
        request.input("MinPrice", sql.Decimal(10, 2), minPrice);
        request.input("MaxPrice", sql.Decimal(10, 2), maxPrice);
        request.input("Search", sql.VarChar(100), search);

        const result = await request.execute("ViewProducts");

        res.json({
            success: true,
            products: result.recordset
        });

    } catch (err) {
        console.error("View products error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.get("/view-my-products", async (req, res) => {
    const userId = parseInt(req.query.userId);
    const categoryId = parseInt(req.query.categoryId) || 0;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 999999;
    const search = req.query.search || "";

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    try {
        const request = pool.request();

        request.input("UserID", sql.Int, userId);
        request.input("CategoryID", sql.Int, categoryId);
        request.input("MinPrice", sql.Decimal(10, 2), minPrice);
        request.input("MaxPrice", sql.Decimal(10, 2), maxPrice);
        request.input("Search", sql.VarChar(100), search);

        const result = await request.execute("ViewMyProducts");

        res.json({
            success: true,
            products: result.recordset
        });

    } catch (err) {
        console.error("View my products error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.get("/product/:id", async (req, res) => {
    try {
        const request = pool.request();
        request.input("ProductID", sql.Int, parseInt(req.params.id));
        const result = await request.execute("ViewProductById");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            product: result.recordset[0]
        });

    } catch (err) {
        console.error("Get product error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product"
        });
    }
});

// ============================================
// ORDER & TRANSACTION ROUTES
// ============================================

app.post("/place-order", async (req, res) => {
    const { ProductID, BuyerID, Quantity } = req.body;

    if (!ProductID || !BuyerID || !Quantity) {
        return res.status(400).json({
            success: false,
            message: "ProductID, BuyerID and Quantity are required"
        });
    }

    try {
        const request = pool.request();

        request.input("ProductID", sql.Int, parseInt(ProductID));
        request.input("BuyerID", sql.Int, parseInt(BuyerID));
        request.input("Quantity", sql.Int, parseInt(Quantity));

        const result = await request.execute("PlaceOrder");

        res.json({
            success: true,
            message: "Order placed successfully",
            order: result.recordset[0]
        });

    } catch (err) {
        console.error("Place order error:", err);
        
        const errorMessage = err.originalError 
            ? err.originalError.message 
            : "Failed to place order";

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});



app.post("/confirm-transaction", async (req, res) => {
    const { OrderID, ProductID, Quantity, TotalAmount, BuyerID } = req.body;

    if (!OrderID || !ProductID || !Quantity || !TotalAmount || !BuyerID) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {
        const request = pool.request();

        request.input("OrderID", sql.Int, parseInt(OrderID));
        request.input("ProductID", sql.Int, parseInt(ProductID));
        request.input("Quantity", sql.Int, parseInt(Quantity));
        request.input("TotalAmount", sql.Decimal(10, 2), parseFloat(TotalAmount));
        request.input("BuyerID", sql.Int, parseInt(BuyerID));

        await request.execute("ConfirmTransaction");

        res.json({
            success: true,
            message: "Transaction confirmed successfully"
        });

    } catch (err) {
        console.error("Confirm transaction error:", err);
        
        const errorMessage = err.originalError 
            ? err.originalError.message 
            : "Transaction failed";

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});
// ============================================
// CHAT ROUTES
// ============================================

app.post("/open-chat", async (req, res) => {
    const { senderId, receiverId, productName } = req.body;

    if (!senderId || !receiverId || !productName) {
        return res.status(400).json({
            success: false,
            message: "senderId, receiverId and productName are required"
        });
    }

    try {
        const request = pool.request();

        request.input("User1ID", sql.Int, parseInt(senderId));
        request.input("User2ID", sql.Int, parseInt(receiverId));
        request.input("ChatName", sql.VarChar(30), productName);

        const result = await request.execute("OpenChat");

        res.json({
            success: true,
            message: "Chat opened successfully",
            chatId: result.recordset[0].ChatID
        });

    } catch (err) {
        console.error("Open chat error:", err);
        res.status(500).json({
            success: false,
            message: err.originalError ? err.originalError.message : "Failed to open chat"
        });
    }
});

app.post("/send-message", async (req, res) => {
    const { senderId, chatId, message } = req.body;

    if (!senderId || !chatId || !message) {
        return res.status(400).json({
            success: false,
            message: "senderId, chatId and message are required"
        });
    }

    try {
        const request = pool.request();

        request.input("SenderID", sql.Int, parseInt(senderId));
        request.input("ChatID", sql.Int, parseInt(chatId));
        request.input("MessageText", sql.VarChar(1000), message);

        await request.execute("SendMessage");

        res.json({
            success: true,
            message: "Message sent successfully"
        });

    } catch (err) {
        console.error("Send message error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to send message"
        });
    }
});

app.get("/get-chats/:userId", async (req, res) => {
    try {
        const request = pool.request();
        request.input("UserID", sql.Int, parseInt(req.params.userId));

        const result = await request.execute("GetChats");

        res.json({
            success: true,
            chats: result.recordset
        });

    } catch (err) {
        console.error("Load chats error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load chats"
        });
    }
});

app.get("/chat/:id", async (req, res) => {
    const chatId = req.params.id;
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    try {
        const request = pool.request();

        request.input("ChatID", sql.Int, parseInt(chatId));
        request.input("UserID", sql.Int, parseInt(userId));

        const result = await request.execute("GetChatById");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Chat not found"
            });
        }

        res.json({
            success: true,
            chat: result.recordset[0]
        });

    } catch (err) {
        console.error("Get chat error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load chat"
        });
    }
});

app.get("/messages/:id", async (req, res) => {
    const chatId = parseInt(req.params.id);

    if (!chatId) {
        return res.status(400).json({
            success: false,
            message: "Chat ID is required"
        });
    }

    try {
        const request = pool.request();
        request.input("ChatID", sql.Int, chatId);

        const result = await request.execute("GetMessages");

        res.json({
            success: true,
            messages: result.recordset
        });

    } catch (err) {
        console.error("Load messages error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load messages"
        });
    }
});

// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {
    res.send("Server is running");
});

// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});



// ============================================
// MY ORDERS ROUTES
// ============================================

app.get("/view-my-orders", async (req, res) => {
    const userId = parseInt(req.query.userId);
    const categoryId = parseInt(req.query.categoryId) || 0;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 999999;
    const search = req.query.search || "";

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    try {
        const request = pool.request();

        request.input("UserID", sql.Int, userId);
        request.input("CategoryID", sql.Int, categoryId);
        request.input("MinPrice", sql.Decimal(10, 2), minPrice);
        request.input("MaxPrice", sql.Decimal(10, 2), maxPrice);
        request.input("Search", sql.VarChar(100), search);

        const result = await request.execute("ViewMyOrders");

        res.json({
            success: true,
            orders: result.recordset
        });

    } catch (err) {
        console.error("View my orders error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

app.get("/order/:id", async (req, res) => {
    const orderId = parseInt(req.params.id);

    if (!orderId) {
        return res.status(400).json({
            success: false,
            message: "Order ID is required"
        });
    }

    try {
        const request = pool.request();
        request.input("OrderID", sql.Int, orderId);

        const result = await request.execute("ViewOrderDetail");

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            order: result.recordset[0]
        });

    } catch (err) {
        console.error("View order detail error:", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});







