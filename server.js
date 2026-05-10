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


// Connect once (better than reconnecting every request)
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


app.post("/login", async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password required"
        });
    }

    try {

        const request = pool.request();

        request.input("email", sql.VarChar(100), email);
        request.input("password", sql.VarChar(100), password);

        const result = await request.execute("LoginUser");

        // if nothing returned
        if (result.recordset.length === 0) {

            return res.json({
                success: false,
                message: "Invalid email or password"
            });

        }

        // success
        res.json({
            success: true,
            message: "Login successful",
            userId: result.recordset[0].id
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Login Failed"
        });

    }

});


app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }

    try {
        const request = pool.request();

        request.input("email", sql.VarChar(100), email);
        request.input("password", sql.VarChar(100), password);

        await request.execute("RegisterUser");

        res.json({
            success: true,
            message: "User registered successfully"
        });

    } catch (err) {
        console.error("SQL error:", err);
        res.status(500).json({
            success: false,
            message: "Registration Failed"
        });
    }
});


app.get("/profile/:id", async (req, res) => {
    try {
        const request = pool.request();
        request.input("userId", sql.Int, parseInt(req.params.id));
        const result = await request.execute("GetUserProfile"); 

        res.json({
            success: true,
            userdetails: result.recordset[0]
        });

    } catch (err) {
        console.log("SQL error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
});
    
app.post("/update-profile", async (req, res) => {
    const { fname, lname, phone, pfp, userId } = req.body;

    try {
        const request = pool.request();

        request.input("fname", sql.VarChar(100), fname);
        request.input("lname", sql.VarChar(100), lname);
        request.input("phone", sql.VarChar(100), phone);
        request.input("pfp", sql.VarChar(255), pfp);
        const wallet = req.body.add_wallet
        ? parseFloat(req.body.add_wallet)
        : 0;

        request.input("add_wallet", sql.Decimal(10, 2), wallet);
        request.input("userId", sql.Int, userId);

        await request.execute("UpdateProfile");

        res.json({
            success: true,
            message: "Profile updated successfully"
        });

    } catch (err) {
        console.error("SQL error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update profile"
        });
    }
});


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

    // basic validation
    if (!ProductName || !Price || !Quantity || !SellerID || !CategoryID) {
        return res.status(400).json({
            message: "Missing required fields"
        });
    }

    try {
        const request = pool.request();

        request.input("ProductName", sql.VarChar(100), ProductName);
        request.input("Description", sql.VarChar(255), Description);
        request.input("Price", sql.Decimal(10, 2), Price);
        request.input("Quantity", sql.Int, Quantity);
        request.input("ImageURL", sql.VarChar(255), ImageURL);
        request.input("SellerID", sql.Int, SellerID);
        request.input("CategoryID", sql.Int, CategoryID);

        await request.execute("AddProduct"); // stored procedure name

        res.json({
            success: true,
            message: "Product added successfully"
        });

    } catch (err) {
        console.error("SQL error:", err);

        res.status(500).json({
            success: false,
            message: "Product insertion failed"
        });
    }
});

app.get("/view-products", async (req, res) => {
    try {
        const request = pool.request();
        const result = await request.execute("ViewProduct");

        res.json({
            success: true,
            products: result.recordset
        });

    } catch (err) {
        console.error("View products error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
});

app.get("/product/:id", async (req, res) => {
    try {
        const request = pool.request();
        request.input("ProductID", sql.Int, parseInt(req.params.id));
        const result = await request.execute("ViewProductById");

        res.json({
            success: true,
            product: result.recordset[0]
        });

    } catch (err) {
        console.log("View products error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products"
        });
    }
});

app.post("/place-order", async (req, res) => {

    const {
        ProductID,
        BuyerID,
        Quantity
    } = req.body;

    try {

        const request = pool.request();

        request.input("ProductID", sql.Int, ProductID);
        request.input("BuyerID", sql.Int, BuyerID);
        request.input("Quantity", sql.Int, Quantity);

        const result = await request.execute("PlaceOrder");
        
        res.json({
            success: true,
            message: "Order placed successfully",
            order: result.recordset[0]
        });

    } catch (err) {

        console.error("Place order error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

app.post("/confirm-transaction", async (req, res) => {

    const {
        ProductID,
        Quantity,
        TotalAmount,
        BuyerID
    } = req.body;

    try {

        const request = pool.request();

        request.input("ProductID", sql.Int, ProductID);
        request.input("Quantity", sql.Int, Quantity);
        request.input("TotalAmount", sql.Decimal(10, 2), TotalAmount);
        request.input("BuyerID", sql.Int, BuyerID);

        await request.execute("ConfirmTransaction");

        res.json({
            success: true,
            message: "Transaction confirmed successfully",
        });

    } catch (err) {

        console.error("Confirm Transaction Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
});


// Optional: test route
app.get("/", (req, res) => {
    res.send("Server is running");
});


// Start server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});