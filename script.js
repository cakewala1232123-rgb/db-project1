console.log("script loaded");

let items = [];
let basePrice_productDetails = 0;
let availableQty_productDetails = 0;
let Chats = [];

function go(page){
    window.location.href = page;
}

const pageControllers = {
    "product-details.html": fillProductDetail,
    "dashboard.html": loadProducts,
    "profile.html": loadProfile,
    "chats.html": loadChats,
    "order-details.html": fillOrderDetail
};


window.onload = () => {
    const page = window.location.pathname.split("/").pop();
    const controller = pageControllers[page];
    if (controller) {
        controller();
    }
};

// ============================================
// AUTH FUNCTIONS
// ============================================

async function login(){
    const emailEl = document.getElementById("email_login");
    const passwordEl = document.getElementById("password_login");
    
    if (!emailEl || !passwordEl) return;
    
    const email = emailEl.value;
    const password = passwordEl.value;

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("userId", data.userId);
            alert("Login successful!");
            go("dashboard.html");
        } else {
            alert(data.message || "Login failed");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Server error");
    }
}

async function register(){
    const emailEl = document.getElementById("email_register");
    const passwordEl = document.getElementById("password_register");
    
    if (!emailEl || !passwordEl) return;
    
    const email = emailEl.value;
    const password = passwordEl.value;

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
        console.error("Registration error:", err);
        alert("Server error");
    }
}

// ============================================
// PROFILE FUNCTIONS
// ============================================

async function updateProfile(){
    const fname = document.getElementById("update_fname")?.value || "";
    const lname = document.getElementById("update_lname")?.value || "";
    const phone = document.getElementById("update_phone")?.value || "";
    const pfp = document.getElementById("update_pfp")?.value || "";
    const add_wallet = document.getElementById("add_wallet")?.value || "0";
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("Please login first");
        go("login.html");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/update-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fname, lname, phone, pfp, add_wallet, userId })
        });

        const data = await res.json();

        if (data.success) {
            alert("Profile updated successfully!");
            go("dashboard.html");
        } else {
            alert(data.message || "Failed to update profile");
        }
    } catch (err) {
        console.error("Update profile error:", err);
        alert("Server error");
    }
}

async function loadProfile() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("User not logged in");
        go("login.html");
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

        const pName = document.getElementById("p_name");
        const pEmail = document.getElementById("p_email");
        const pPhone = document.getElementById("p_phone");
        const pBalance = document.getElementById("p_balance");
        const pProducts = document.getElementById("p_products");
        const pOrders = document.getElementById("p_orders");
        const pPfp = document.getElementById("p_pfp");

        if (pName) pName.innerText = (u.fname || "") + " " + (u.lname || "");
        if (pEmail) pEmail.innerText = u.email || "";
        if (pPhone) pPhone.innerText = u.phone || "Not set";
        if (pBalance) pBalance.innerText = "Rs " + (u.WalletBalance || 0);
        if (pProducts) pProducts.innerText = u.ProductsCount || 0;
        if (pOrders) pOrders.innerText = u.OrdersCount || 0;
        if (pPfp) pPfp.src = u.pfp || "https://via.placeholder.com/120";

    } catch (err) {
        console.error("Load profile error:", err);
        alert("Server error while loading profile");
    }
}

function editProfile(){
    const profileBox = document.getElementById("profileBox");
    if (profileBox) profileBox.classList.remove("hidden");
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openModal(){
    const modal = document.getElementById("modal");
    if (modal) modal.classList.remove("hidden");
}

function closeModal(){
    const modal = document.getElementById("modal");
    if (modal) modal.classList.add("hidden");
}

function openTransactionModal() {
    const modal = document.getElementById("transaction_modal");
    if (modal) modal.classList.remove("hidden");
}

function closeTransactionModal() {
    const modal = document.getElementById("transaction_modal");
    if (modal) modal.classList.add("hidden");
    location.reload();
}

// ============================================
// PRODUCT FUNCTIONS
// ============================================

async function addProduct() {
    const productName = document.getElementById("product_name")?.value;
    const description = document.getElementById("product_desc")?.value || "";
    const price = document.getElementById("product_price")?.value;
    const quantity = document.getElementById("product_qty")?.value;
    const imageURL = document.getElementById("product_image")?.value || "";
    const sellerID = localStorage.getItem("userId");
    const categoryID = document.getElementById("category_id")?.value;

    if (!productName || !price || !quantity || !sellerID || !categoryID) {
        alert("Please fill all required fields");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/add-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ProductName: productName,
                Description: description,
                Price: price,
                Quantity: quantity,
                ImageURL: imageURL,
                SellerID: sellerID,
                CategoryID: categoryID
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("Product added successfully!");
            reloadCurrentProductPage();
            closeModal();

            // Clear form
            document.getElementById("product_name").value = "";
            document.getElementById("product_desc").value = "";
            document.getElementById("product_price").value = "";
            document.getElementById("product_qty").value = "";
            document.getElementById("product_image").value = "";
            document.getElementById("category_id").value = "";
        } else {
            alert(data.message || "Failed to add product");
        }
    } catch (err) {
        console.error("Add product error:", err);
        alert("Server error while adding product");
    }
}

async function removeProduct(productId) {
    if (!confirm("Are you sure you want to remove this product?")) {
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/remove-product", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ProductID: productId })
        });

        const data = await res.json();

        if (data.success) {
            alert("Product removed successfully!");
            go("dashboard.html");
        } else {
            alert(data.message || "Failed to remove product");
        }
    } catch (err) {
        console.error("Remove product error:", err);
        alert("Server error");
    }
}

// ============================================
// FILTER FUNCTIONS
// ============================================

function syncPriceInput() {
    const slider = document.getElementById("filter_max_price");
    const input = document.getElementById("filter_max_price_input");
    if (slider && input) input.value = slider.value;
}

function syncPriceSlider() {
    const input = document.getElementById("filter_max_price_input");
    const slider = document.getElementById("filter_max_price");
    if (input && slider) slider.value = input.value;
}

// ============================================
// LOAD PRODUCTS
// ============================================

async function loadProducts() {
    localStorage.setItem("currentProductPage", "allProducts");

    const categoryId = document.getElementById("filter_category")?.value || 0;
    const maxPrice = document.getElementById("filter_max_price")?.value || 99999;
    const search = document.getElementById("filter_search")?.value || "";

    try {
        const url = `http://localhost:3000/view-products?categoryId=${categoryId}&minPrice=0&maxPrice=${maxPrice}&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const data = await res.json();

        items = data.products || [];
        renderProducts();
    } catch (err) {
        console.error("Error loading products:", err);
    }
}

function renderProducts() {
    const container = document.getElementById("items");
    if (!container) return;
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = "<p style='text-align:center;padding:20px;'>No products found</p>";
        return;
    }

    items.forEach((p) => {
        container.innerHTML += `
            <div class="card" onclick="go('product-details.html?id=${p.ProductID}')">
                <img src="${p.ImageURL || 'https://via.placeholder.com/200'}" 
                     alt="${p.ProductName}"
                     onerror="this.src='https://via.placeholder.com/200'" />
                <h4>${p.ProductName}</h4>
                <p class="price">Rs ${p.Price}</p>
                <p>Qty: ${p.Quantity}</p>
            </div>
        `;
    });
}

async function loadMyProducts() {
    localStorage.setItem("currentProductPage", "myProducts");

    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Please login first");
        go("login.html");
        return;
    }

    const categoryId = document.getElementById("filter_category")?.value || 0;
    const maxPrice = document.getElementById("filter_max_price")?.value || 99999;
    const search = document.getElementById("filter_search")?.value || "";

    try {
        const url = `http://localhost:3000/view-my-products?userId=${userId}&categoryId=${categoryId}&minPrice=0&maxPrice=${maxPrice}&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const data = await res.json();

        items = data.products || [];
        renderMyProducts();
    } catch (err) {
        console.error("Error loading my products:", err);
    }
}

function renderMyProducts() {
    const container = document.getElementById("items");
    if (!container) return;
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = "<p style='text-align:center;padding:20px;'>You haven't added any products yet</p>";
        return;
    }

    items.forEach((p) => {
        container.innerHTML += `
            <div class="card" onclick="go('product-details.html?id=${p.ProductID}')">
                <img src="${p.ImageURL || 'https://via.placeholder.com/200'}" 
                     alt="${p.ProductName}"
                     onerror="this.src='https://via.placeholder.com/200'" />
                <h4>${p.ProductName}</h4>
                <p class="price">Rs ${p.Price}</p>
                <p>Qty: ${p.Quantity}</p>
            </div>
        `;
    });
}

function reloadCurrentProductPage() {
    const currentPage = localStorage.getItem("currentProductPage") || "allProducts";

    if (currentPage === "allProducts") {
        loadProducts();
    } else if (currentPage === "myProducts") {
        loadMyProducts();
    } else if (currentPage === "myOrders") {
        loadMyOrders();
    }
}


// ============================================
// PRODUCT DETAILS (FIXED)
// ============================================

async function fillProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) {
        alert("No product ID specified");
        go("dashboard.html");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/product/${productId}`);
        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to load product");
            return;
        }

        const p = data.product;
        const currentPage = localStorage.getItem("currentProductPage") || "allProducts";

        // Set product details with null checks
        const pName = document.getElementById("p_name");
        const pPrice = document.getElementById("p_price");
        const pQty = document.getElementById("p_qty");
        const pDesc = document.getElementById("p_desc");
        const pImage = document.getElementById("p_image");
        const sellerPhone = document.getElementById("seller_phone");
        const sellerName = document.getElementById("seller_name");
        const chatButton = document.getElementById("chat_button");

        if (pName) pName.innerText = p.ProductName;
        if (pPrice) pPrice.innerText = "Rs " + p.Price;
        basePrice_productDetails = p.Price;
        if (pQty) pQty.innerText = p.Quantity;
        availableQty_productDetails = p.Quantity;
        if (pDesc) pDesc.innerText = p.Description || "No description available";
        if (pImage) {
            pImage.src = p.ImageURL || "https://via.placeholder.com/300";
            pImage.onerror = function() {
                this.src = "https://via.placeholder.com/300";
            };
        }
        if (sellerPhone) sellerPhone.innerText = p.phone || "Not available";
        if (sellerName) sellerName.innerText = (p.fname || "") + " " + (p.lname || "");

        // Set chat button based on context
        if (chatButton) {
            const userId = localStorage.getItem("userId");
            
            if (currentPage === "myProducts" || (userId && parseInt(userId) === p.SellerID)) {
                // User viewing own product - show remove button
                chatButton.innerHTML = `
                    <button class="btn primary" onclick="removeProduct(${p.ProductID})">
                        Remove Product
                    </button>
                `;
            } else {
                // User viewing other's product - show chat button
                chatButton.innerHTML = `
                    <button class="btn primary" onclick="startChat(${p.SellerID}, '${p.ProductName.replace(/'/g, "\\'")}')">
                        Chat with Seller
                    </button>
                `;
            }
        }

    } catch (err) {
        console.error("Error loading product:", err);
        alert("Server error while loading product");
    }
}

// ============================================
// QUANTITY FUNCTIONS
// ============================================

function incQty(id, priceId) {
    const qt = document.getElementById(id);
    const pr = document.getElementById(priceId);
    
    if (!qt || !pr) return;
    
    if (Number(qt.value) < availableQty_productDetails) {
        qt.value = Number(qt.value) + 1;
        pr.innerText = "Rs " + (basePrice_productDetails * qt.value);
    }
}

function decQty(id, priceId) {
    const qt = document.getElementById(id);
    const pr = document.getElementById(priceId);
    
    if (!qt || !pr) return;
    
    if (qt.value > 1 && qt.value <= availableQty_productDetails) {
        qt.value = Number(qt.value) - 1;
        pr.innerText = "Rs " + (basePrice_productDetails * qt.value);
    }
}

// ============================================
// ORDER FUNCTIONS
// ============================================
async function placeOrder() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const buyerId = localStorage.getItem("userId");
    const qtyEl = document.getElementById("order_qty");
    const quantity = qtyEl ? qtyEl.value : 1;

    if (!buyerId) {
        alert("Please login first");
        go("login.html");
        return;
    }

    if (!productId) {
        alert("Missing order information");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/place-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ProductID: parseInt(productId),
                BuyerID: parseInt(buyerId),
                Quantity: parseInt(quantity)
            })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem("activeOrderPayment", data.order.OrderID);
            document.getElementById("transaction_product").innerText = "Product: " + data.order.ProductName;
            document.getElementById("transaction_orderId").innerText = "Order ID: " + data.order.OrderID;
            document.getElementById("transaction_total").innerText = "Total: Rs " + data.order.TotalPrice;
            openTransactionModal();
        } else {
            alert(data.message || "Failed to place order");
        }
    } catch (err) {
        console.error("Order error:", err);
        alert("Server error");
    }
}

async function confirmTransaction() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const qtyEl = document.getElementById("order_qty");
    const totalEl = document.getElementById("transaction_total");
    const orderId = localStorage.getItem("activeOrderPayment");

    if (!productId || !qtyEl || !totalEl || !orderId) {
        alert("Missing transaction information");
        return;
    }

    const quantity = qtyEl.value;
    const totalText = totalEl.innerText.replace("Total: Rs ", "");
    const totalAmount = parseFloat(totalText);

    try {
        const res = await fetch("http://localhost:3000/confirm-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                OrderID: parseInt(orderId),
                ProductID: parseInt(productId),
                Quantity: parseInt(quantity),
                TotalAmount: totalAmount,
                BuyerID: parseInt(localStorage.getItem("userId"))
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("Transaction confirmed! Payment successful.");
            closeTransactionModal();
        } else {
            alert(data.message || "Failed to confirm transaction");
        }
    } catch (err) {
        console.error("Transaction error:", err);
        alert("Server error");
    }
}


// ============================================
// CHAT FUNCTIONS
// ============================================

async function startChat(SellerId, productName){
    const senderId = localStorage.getItem("userId");
    const receiverId = SellerId;

    if (!senderId) {
        alert("Please login first");
        go("login.html");
        return;
    }

    if (senderId == receiverId) {
        alert("Cannot chat with yourself");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/open-chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senderId: parseInt(senderId),
                receiverId: parseInt(receiverId),
                productName: productName
            })
        });

        const data = await res.json();

        if (data.success) {
            go(`chats.html?id=${data.chatId}`);
        } else {
            alert(data.message || "Failed to open chat");
        }
    } catch (err) {
        console.error("Chat error:", err);
        alert("Server error");
    }
}

async function sendMessage() {
    const chatId = getActiveChatId();
    const senderId = localStorage.getItem("userId");
    const msgEl = document.getElementById("chat_input");
    
    if (!msgEl) return;
    
    const msg = msgEl.value;

    if (!msg) {
        alert("Enter a message");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/send-message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                senderId: parseInt(senderId),
                chatId: parseInt(chatId),
                message: msg
            })
        });

        const data = await res.json();

        if (data.success) {
            msgEl.value = "";
            loadMessages(chatId);
        } else {
            alert(data.message || "Failed to send message");
        }
    } catch (err) {
        console.error("Message error:", err);
        alert("Server error");
    }
}

async function loadChats() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        alert("Please login first");
        go("login.html");
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const chatIdFromUrl = params.get("id");

    try {
        const res = await fetch(`http://localhost:3000/get-chats/${userId}`);
        const data = await res.json();

        Chats = data.chats || [];
        renderChats();

        if (chatIdFromUrl) {
            openConversation(chatIdFromUrl);
        }
    } catch (err) {
        console.error("Error loading chats:", err);
    }
}

function renderChats() {
    const container = document.getElementById("chat_sidebar");
    if (!container) return;

    container.innerHTML = `<h2>Marketplace</h2>`;

    if (Chats.length === 0) {
        container.innerHTML += "<p style='padding:10px;'>No chats yet</p>";
        return;
    }

    Chats.forEach((c) => {
        container.innerHTML += `
            <button onclick="openConversation(${c.ChatID})" 
                    style="display:block;width:100%;margin:5px 0;padding:10px;text-align:left;">
                ${c.ChatName || 'Chat'} - ${c.OtherUserName || 'Unknown'}
            </button>
        `;
    });
}

async function openConversation(chatId) {
    const userId = localStorage.getItem("userId");
    localStorage.setItem("activeChatId", chatId);

    try {
        const res = await fetch(`http://localhost:3000/chat/${chatId}?userId=${userId}`);
        const data = await res.json();

        if (!data.chat) {
            alert("Chat not found");
            return;
        }

        const chatTitle = document.getElementById("chat_title");
        const chatUser = document.getElementById("chat_user");
        const chatPfp = document.getElementById("chat_pfp");

        if (chatTitle) chatTitle.innerText = data.chat.ChatName || "Chat";
        if (chatUser) chatUser.innerText = data.chat.OtherUserName || "Unknown";
        if (chatPfp) {
            chatPfp.src = data.chat.pfp || "https://via.placeholder.com/120";
            chatPfp.onerror = function() {
                this.src = "https://via.placeholder.com/120";
            };
        }

        loadMessages(chatId);
    } catch (err) {
        console.error("Open conversation error:", err);
    }
}

async function loadMessages(chatId) {
    try {
        const res = await fetch(`http://localhost:3000/messages/${chatId}`);
        const data = await res.json();

        if (!data.success) return;

        renderMessages(data.messages || []);
    } catch (err) {
        console.error("loadMessages error:", err);
    }
}

function renderMessages(messages) {
    const container = document.getElementById("messages");
    if (!container) return;

    container.innerHTML = "";

    if (messages.length === 0) {
        container.innerHTML = "<p style='text-align:center;padding:20px;'>No messages yet</p>";
        return;
    }

    const userId = localStorage.getItem("userId");

    messages.forEach((m) => {
        const side = m.SenderID == userId ? "right" : "left";
        container.innerHTML += `
            <div class="msg ${side}">
                <b>${m.SenderName || 'Unknown'}</b><br>
                ${m.MessageText}
            </div>
        `;
    });

    container.scrollTop = container.scrollHeight;
}

function getActiveChatId() {
    return localStorage.getItem("activeChatId");
}











// ============================================
// MY ORDERS FUNCTIONS (ADD TO script.js)
// ============================================

async function loadMyOrders() {
    localStorage.setItem("currentProductPage", "myOrders");

    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Please login first");
        go("login.html");
        return;
    }

    const categoryId = document.getElementById("filter_category")?.value || 0;
    const maxPrice = document.getElementById("filter_max_price")?.value || 99999;
    const search = document.getElementById("filter_search")?.value || "";

    try {
        const url = `http://localhost:3000/view-my-orders?userId=${userId}&categoryId=${categoryId}&minPrice=0&maxPrice=${maxPrice}&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const data = await res.json();

        items = data.orders || [];
        renderMyOrders();
    } catch (err) {
        console.error("Error loading my orders:", err);
    }
}

function renderMyOrders() {
    const container = document.getElementById("items");
    if (!container) return;
    container.innerHTML = "";

    if (items.length === 0) {
        container.innerHTML = "<p style='text-align:center;padding:20px;'>No orders found</p>";
        return;
    }

    items.forEach((o) => {
        const hasTransaction = o.TransactionID ? true : false;
        
        container.innerHTML += `
            <div class="card" onclick="go('order-details.html?id=${o.OrderID}')">
                <img src="${o.ImageURL || 'https://via.placeholder.com/200'}" 
                     alt="${o.ProductName}"
                     onerror="this.src='https://via.placeholder.com/200'" />
                <h4>${o.ProductName}</h4>
                <p class="price">Total : Rs ${o.TotalPrice}</p>
                <p>Qty: ${o.Quantity}</p>
                <p style="font-size:12px;color:#666;">Order #${o.OrderID}</p>
                <p style="font-size:12px;color:#666;">${new Date(o.OrderDate).toLocaleDateString()}</p>
                ${hasTransaction ? '<p style="color:green;font-size:12px;">✓ Paid</p>' : '<p style="color:orange;font-size:12px;">Pending Payment</p>'}
            </div>
        `;
    });
}

async function fillOrderDetail() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("id");

    if (!orderId) {
        alert("No order ID specified");
        go("dashboard.html");
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/order/${orderId}`);
        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Failed to load order");
            return;
        }

        const o = data.order;

        // Product details
        const pName = document.getElementById("p_name");
        const pPrice = document.getElementById("p_price");
        const pQty = document.getElementById("p_qty");
        const pDesc = document.getElementById("p_desc");
        const pImage = document.getElementById("p_image");
        const sellerPhone = document.getElementById("seller_phone");
        const sellerName = document.getElementById("seller_name");

        if (pName) pName.innerText = o.ProductName || "N/A";
        if (pPrice) pPrice.innerText = "Rs " + (o.UnitPrice || 0) + " each";
        if (pQty) pQty.innerText = "Qty: " + (o.Quantity || 0);
        if (pDesc) pDesc.innerText = o.Description || "No description";
        if (pImage) {
            pImage.src = o.ImageURL || "https://via.placeholder.com/300";
            pImage.onerror = function() { this.src = "https://via.placeholder.com/300"; };
        }
        if (sellerPhone) sellerPhone.innerText = o.phone || "Not available";
        if (sellerName) sellerName.innerText = (o.fname || "") + " " + (o.lname || "");

        // Order details
        const orderIdEl = document.getElementById("o_order_id");
        const orderDateEl = document.getElementById("o_date");
        const orderTotalEl = document.getElementById("o_total");

        if (orderIdEl) orderIdEl.innerText = "Order #" + o.OrderID;
        if (orderDateEl) orderDateEl.innerText = new Date(o.OrderDate).toLocaleString();
        if (orderTotalEl) orderTotalEl.innerText = "Rs " + (o.TotalAmount || 0);

        // Transaction details
        const transIdEl = document.getElementById("t_id");
        const transDateEl = document.getElementById("t_date");
        const transAmountEl = document.getElementById("t_amount");

        if (o.TransactionID) {
            if (transIdEl) transIdEl.innerText = "Transaction #" + o.TransactionID;
            if (transDateEl) transDateEl.innerText = new Date(o.TransactionDate).toLocaleString();
            if (transAmountEl) transAmountEl.innerText = "Rs " + (o.TotalAmount || 0);
        } else {
            if (transIdEl) transIdEl.innerText = "Not paid yet";
            if (transDateEl) transDateEl.innerText = "-";
            if (transAmountEl) transAmountEl.innerText = "-";
        }

    } catch (err) {
        console.error("Error loading order:", err);
        alert("Server error while loading order");
    }
}
