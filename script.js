console.log("script loaded");

let items = [];
let basePrice_productDetails = 0;
let availableQty_productDetails = 0;
function go(page){
    window.location.href = page;
}

const pageControllers = {
    "product-details.html": fillProductDetail,
    "dashboard.html": loadProducts,
    "profile.html": loadProfile
};

window.onload = () => {

    const page = window.location.pathname.split("/").pop();

    const controller = pageControllers[page];

    if (controller) {
        controller();
    }

};

async function login(){

    const email = document.getElementById("email_login").value;
    const password = document.getElementById("password_login").value;

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("userId", data.userId);
            alert("Login successful!");
            go("dashboard.html");

        }   else {
            alert(data.message || "Login failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

async function register(){
    const email = document.getElementById("email_register").value;
    const password = document.getElementById("password_register").value;

    try {
        const res = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            alert("Registration successful!");
            go("login.html");
        } else {
            alert(data.message || "Registration failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}

async function updateProfile(){

    const fname = document.getElementById("update_fname").value;
    const lname= document.getElementById("update_lname").value;
    const phone= document.getElementById("update_phone").value;
    const pfp= document.getElementById("update_pfp").value;
    const add_wallet= document.getElementById("add_wallet").value;
    const userId = localStorage.getItem("userId");
    try {
        const res = await fetch("http://localhost:3000/update-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ fname, lname, phone, pfp, add_wallet, userId })
        });

        const data = await res.json();

        if (data.success) {
            alert("Profile updated successfully!");
            go("dashboard.html");

        }   else {
            alert(data.message || "Failed to update profile");
        }

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
}


async function loadProfile() {

    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("User not logged in");
        return;
    }

    try {

        const res = await fetch(`http://localhost:3000/profile/${userId}`);

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to load profile");
            return;
        }

        const u = data.userdetails;

        document.getElementById("p_name").innerText =
            (u.fname || "") + " " + (u.lname || "");

        document.getElementById("p_email").innerText =
            u.email || "";

        document.getElementById("p_phone").innerText =
            u.phone || "Not set";

        document.getElementById("p_balance").innerText =
            "Rs " + (u.WalletBalance || 0);

        document.getElementById("p_products").innerText =
            u.ProductsCount || 0;

        document.getElementById("p_orders").innerText =
            u.OrdersCount || 0;

        document.getElementById("p_pfp").src =
            u.pfp || "https://via.placeholder.com/120";

    } catch (err) {

        console.log(err);
        alert("Server error while loading profile");
    }
}


function editProfile(){
    document.getElementById("profileBox").classList.remove("hidden");
}

function openModal(){
    document.getElementById("modal").classList.remove("hidden");
}

function closeModal(){
    document.getElementById("modal").classList.add("hidden");
}

async function addProduct() {

    const product = {
        ProductName: document.getElementById("product_name").value,
        Description: document.getElementById("product_desc").value,
        Price: document.getElementById("product_price").value,
        Quantity: document.getElementById("product_qty").value,
        ImageURL: document.getElementById("product_image").value,
        SellerID: localStorage.getItem("userId"),
        CategoryID: document.getElementById("category_id").value
    };

    try {
        const res = await fetch("http://localhost:3000/add-product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });

        const data = await res.json();

        if (data.success) {
            alert("Product added successfully!");
           loadProducts();

            closeModal(); // hide popup

            // clear form after success
            document.getElementById("product_name").value = "";
            document.getElementById("product_desc").value = "";
            document.getElementById("product_price").value = "";
            document.getElementById("product_qty").value = "";
            document.getElementById("product_image").value = "";
            document.getElementById("seller_id").value = "";
            document.getElementById("category_id").value = "";

        } else {
            alert(data.message || "Failed to add product");
        }

    } catch (err) {
        console.error("FULL SQL ERROR:");
    console.log(err);
    }
}

async function loadProducts() {
    try {
        const res = await fetch("http://localhost:3000/view-products");
        const data = await res.json();

        items = data.products || [];
        renderProducts();

    } catch (err) {
        console.log("Error loading products:", err);
    }
}

function openProduct(id){
    localStorage.setItem("productId", id);
    go("product-details.html");
}

function renderProducts() {
    const container = document.getElementById("items");
    if (!container) return;

    container.innerHTML = "";

    items.forEach((p) => {
    container.innerHTML += `
        <div class="card" onclick="go('product-details.html?id=${p.ProductID}')">

            <img src="${p.ImageURL || 'https://via.placeholder.com/200'}" />

            <h4>${p.ProductName}</h4>
            <p class="price">Rs ${p.Price}</p>
            <p>Qty: ${p.Quantity}</p>

        </div>
    `;
});
}

async function fillProductDetail() {

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    try {

        const res = await fetch(
            `http://localhost:3000/product/${productId}`
        );

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to load product");
            return;
        }

        const p = data.product;

        document.getElementById("p_name").innerText = p.ProductName;
        document.getElementById("p_price").innerText = "Rs " + p.Price;
        basePrice_productDetails = p.Price;        
        document.getElementById("p_qty").innerText = p.Quantity;
        availableQty_productDetails = p.Quantity;
        document.getElementById("p_desc").innerText = p.Description;
        document.getElementById("p_image").src = p.ImageURL || "https://via.placeholder.com/300";

        document.getElementById("seller_phone").innerText = p.phone;
        document.getElementById("seller_name").innerText = p.fname + " " + p.lname;

    } catch (err) {

        console.log("Error loading product:", err);
        alert("Server error while loading product");

    }
}

function incQty(id, priceId) {

    let qt = document.getElementById(id);
    let pr = document.getElementById(priceId);
    if (Number(qt.value) < availableQty_productDetails) {

    qt.value = Number(qt.value) + 1;

    pr.innerText =
        "Rs " + (basePrice_productDetails * qt.value);
}
}

function decQty(id, priceId) {

    let qt = document.getElementById(id);
    let pr = document.getElementById(priceId);
    if (qt.value > 1 && qt.value <= availableQty_productDetails) {

        qt.value = Number(qt.value) - 1;
        pr.innerText = "Rs " + (basePrice_productDetails * qt.value);
    }
}

async function placeOrder() {

    const params = new URLSearchParams(window.location.search);

    const productId = params.get("id");

    const buyerId = localStorage.getItem("userId");

    const quantity = document.getElementById("order_qty").value;

    try {

        const res = await fetch("http://localhost:3000/place-order", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                ProductID: productId,
                BuyerID: buyerId,
                Quantity: quantity
            })

        });

        const data = await res.json();

        if (data.success) {
            
            alert("Order placed successfully!");
             document.getElementById("transaction_product").innerText =
            "Product: " + data.order.ProductName;

            document.getElementById("transaction_orderId").innerText =
                "Order ID: " + data.order.OrderID;

            document.getElementById("transaction_total").innerText =
                "Total: Rs " + data.order.TotalPrice;

            openTransactionModal();

        } else {

            alert(data.message || "Failed to place order");

        }

    } catch (err) {

        console.log("Order error:", err);

        alert("Server error");

    }
}

function openTransactionModal() {
    document
        .getElementById("transaction_modal")
        .classList.remove("hidden");
}

function closeTransactionModal() {
    document
        .getElementById("transaction_modal")
        .classList.add("hidden");
    
    location.reload();
}

async function confirmTransaction() {
    const params = new URLSearchParams(window.location.search);

    const productId = params.get("id");
    const quantity = document.getElementById("order_qty").value;
    const total_amount = parseFloat(document.getElementById("transaction_total").innerText.replace("Total: Rs ", ""));

    try {

        const res = await fetch("http://localhost:3000/confirm-transaction", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                ProductID: productId,
                Quantity: quantity,
                TotalAmount: total_amount,
                BuyerID: localStorage.getItem("userId")
            })

        });

        const data = await res.json();

        if (data.success) {
            
            alert("Transaction confirmed!");
            closeTransactionModal();

        } else {

            alert(data.message || "Failed to confirm transaction");

        }

    } catch (err) {

        console.log("Transaction error:", err);

        alert("Server error");

    }
}

/* Image Preview */
function previewImage(event){
    let img = document.getElementById("preview");
    img.src = URL.createObjectURL(event.target.files[0]);
}

/* Chat */
function openChat(){
    document.getElementById("chatBox").classList.remove("hidden");
}

function sendMessage(){
    let msg = document.getElementById("chatInput").value;
    let box = document.getElementById("chatMessages");

    box.innerHTML += "<p>"+msg+"</p>";
}
