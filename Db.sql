USE project;
GO

DROP PROCEDURE IF EXISTS InsertUser;
GO

DROP PROCEDURE IF EXISTS LoginUser;
GO

DROP PROCEDURE IF EXISTS AddProduct;
GO

DROP PROCEDURE IF EXISTS ViewProduct;
GO

DROP PROCEDURE IF EXISTS ViewProductById;
GO

DROP PROCEDURE IF EXISTS UpdateProfile;
GO

DROP PROCEDURE IF EXISTS PlaceOrder;
GO

DROP PROCEDURE IF EXISTS ConfirmTransaction;
GO

DROP PROCEDURE IF EXISTS GetUserProfile;
GO

DROP TABLE IF EXISTS Transactions;
GO

DROP TABLE IF EXISTS Orders;
GO

DROP TABLE IF EXISTS Products;
GO

DROP TABLE IF EXISTS Categories;
GO

DROP TABLE IF EXISTS Users;
GO

CREATE TABLE Users(
    id INT PRIMARY KEY IDENTITY(1,1),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    fname VARCHAR(100),
    lname VARCHAR(100),
    phone VARCHAR(11) UNIQUE,
    pfp VARCHAR(200),
    WalletBalance DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_phone
    CHECK (
        phone LIKE '03[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    ),

    CONSTRAINT chk_email
        CHECK (email LIKE '%_@_%.__%'),

    CONSTRAINT chk_password
        CHECK (LEN(password) >= 8)
);
GO


CREATE TABLE Categories(
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName VARCHAR(100) NOT NULL,
);
GO

INSERT INTO Categories(CategoryName)
VALUES
('Books'),
('Electronics'),
('Stationery'),
('Clothing'),
('Accessories'),
('Sports Items'),
('Others');
GO


CREATE TABLE Products(
    ProductID INT PRIMARY KEY IDENTITY(1,1),

    ProductName VARCHAR(200) NOT NULL,
    Description VARCHAR(1000),
    Price DECIMAL(10,2) NOT NULL,
    Quantity INT DEFAULT 1 NOT NULL,
    ImageURL VARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    SellerID INT NOT NULL,
    CategoryID INT NOT NULL,

    CONSTRAINT chk_price
        CHECK (Price >= 0),

    CONSTRAINT chk_quantity
        CHECK (Quantity >= 0),

    CONSTRAINT fk_products_seller
        FOREIGN KEY (SellerID)
        REFERENCES Users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_products_category
        FOREIGN KEY (CategoryID)
        REFERENCES Categories(CategoryID)
);
GO

CREATE TABLE Orders(
    OrderID INT PRIMARY KEY IDENTITY(1,1),

    ProductID INT NOT NULL,
    BuyerID INT NOT NULL,

    Quantity INT DEFAULT 1,
    TotalPrice DECIMAL(10,2) NOT NULL,

    OrderDate DATETIME DEFAULT GETDATE(),
    Status VARCHAR(20) DEFAULT 'pending',

    CONSTRAINT chk_order_quantity
        CHECK (Quantity > 0),

    CONSTRAINT chk_total_price
        CHECK (TotalPrice >= 0),

    CONSTRAINT chk_status
        CHECK (Status IN ('pending', 'completed')),

    CONSTRAINT fk_orders_product
        FOREIGN KEY (ProductID)
        REFERENCES Products(ProductID)
        ON DELETE CASCADE,

    CONSTRAINT fk_orders_buyer
        FOREIGN KEY (BuyerID)
        REFERENCES Users(id)
);
GO

CREATE TABLE Transactions(
    TransactionID INT PRIMARY KEY IDENTITY(1,1),

    ProductID INT NOT NULL,
    BuyerID INT NOT NULL,

    Quantity INT DEFAULT 1,
    TotalAmount DECIMAL(10,2) NOT NULL,

    TransactionDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_transaction_quantity
        CHECK (Quantity > 0),

    CONSTRAINT chk_transaction_total_amount
        CHECK (TotalAmount >= 0),

    CONSTRAINT fk_transactions_product
        FOREIGN KEY (ProductID)
        REFERENCES Products(ProductID)
        ON DELETE CASCADE,

    CONSTRAINT fk_transactions_buyer
        FOREIGN KEY (BuyerID)
        REFERENCES Users(id)
);
GO

CREATE PROCEDURE InsertUser
    @email VARCHAR(100),
    @password VARCHAR(100)
AS
BEGIN
    INSERT INTO Users(email, password)
    VALUES(@email, @password)
END
GO

CREATE PROCEDURE LoginUser
    @email VARCHAR(100),
    @password VARCHAR(100)
AS
BEGIN
    SELECT *
    FROM Users
    WHERE email = @email
    AND password = @password
END
GO



CREATE PROCEDURE AddProduct
    @ProductName VARCHAR(200),
    @Description VARCHAR(1000),
    @Price DECIMAL(10,2),
    @Quantity INT,
    @ImageURL VARCHAR(500),
    @SellerID INT,
    @CategoryID INT
AS
BEGIN

    IF @ImageURL = ''
        SET @ImageURL = NULL;
    IF @Description = ''
        SET @Description = NULL;

    INSERT INTO Products(
        ProductName,
        Description,
        Price,
        Quantity,
        ImageURL,
        SellerID,
        CategoryID
    )
    VALUES(
        @ProductName,
        @Description,
        @Price,
        @Quantity,
        @ImageURL,
        @SellerID,
        @CategoryID
    );

END
GO


CREATE PROCEDURE ViewProduct
AS
BEGIN

    SELECT 
        P.ProductID,
        P.ProductName,
        P.Description,
        P.Price,
        P.Quantity,
        P.ImageURL,

        P.SellerID,
        U.email AS SellerEmail,

        P.CategoryID,
        C.CategoryName,

        P.CreatedAt

    FROM Products P
    LEFT JOIN Users U 
        ON P.SellerID = U.id

    LEFT JOIN Categories C 
        ON P.CategoryID = C.CategoryID;

END
GO

CREATE PROCEDURE UpdateProfile
    @fname VARCHAR(100),
    @lname VARCHAR(100),
    @phone VARCHAR(100),
    @pfp VARCHAR(255),
    @add_wallet DECIMAL(10,2),
    @userId INT
AS
BEGIN

IF @pfp = ''
    SET @pfp = NULL;
If @phone = ''
    SET @phone = NULL;
IF @fname = ''
    SET @fname = NULL;
If @lname = ''              
    SET @lname = NULL;
IF @add_wallet IS NULL
    SET @add_wallet = 0;

    UPDATE Users
    SET 
        fname = @fname,
        lname = @lname,
        phone = @phone,
        pfp = @pfp,

        WalletBalance = WalletBalance + @add_wallet
    WHERE id = @userId;

END
GO

CREATE PROCEDURE GetUserProfile
    @userId INT
AS
BEGIN

    SELECT 
        U.id,
        U.email,
        U.fname,
        U.lname,
        U.phone,
        U.pfp,
        U.WalletBalance,

        (SELECT COUNT(*) 
         FROM Products P 
         WHERE P.SellerID = U.id) AS ProductsCount,

        (SELECT COUNT(*) 
         FROM Orders O 
         WHERE O.BuyerID = U.id) AS OrdersCount

    FROM Users U
    WHERE U.id = @userId;

END
GO


CREATE PROCEDURE ViewProductById
    @ProductID INT
AS
BEGIN

    SELECT 
        P.ProductID,
        P.ProductName,
        P.Description,
        P.Price,
        P.Quantity,
        P.ImageURL,
        P.CreatedAt,
        P.CategoryID,

        P.SellerID,
        U.phone,
        U.fname,
        U.lname,

        C.CategoryName

    FROM Products P
    LEFT JOIN Users U 
        ON P.SellerID = U.id

    LEFT JOIN Categories C 
        ON P.CategoryID = C.CategoryID

    WHERE P.ProductID = @ProductID;

END
GO


CREATE PROCEDURE PlaceOrder
    @ProductID INT,
    @BuyerID INT,
    @Quantity INT
AS
BEGIN

    DECLARE @Price DECIMAL(10,2);
    DECLARE @SellerID INT;
    DECLARE @Stock INT;
    DECLARE @TotalPrice DECIMAL(10,2);

    -- get product info
    SELECT
        @Price = Price,
        @Stock = Quantity
    FROM Products
    WHERE ProductID = @ProductID;

    -- validations

    IF NOT EXISTS (
        SELECT 1
        FROM Products
        WHERE ProductID = @ProductID
    )
    BEGIN
        RAISERROR('Product not found', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM Products
        WHERE ProductID = @ProductID
        AND SellerID = @BuyerID
    )
    BEGIN
        RAISERROR('You cannot buy your own product', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM Products
        WHERE ProductID = @ProductID
        AND Quantity < @Quantity
    )
    BEGIN
        RAISERROR('Not enough stock available', 16, 1);
        RETURN;
    END

    SET @TotalPrice = @Price * @Quantity;

    INSERT INTO Orders(
        ProductID,
        BuyerID,
        Quantity,
        TotalPrice
    )
    VALUES(
        @ProductID,
        @BuyerID,
        @Quantity,
        @TotalPrice
    );

    UPDATE Products
    SET Quantity = Quantity - @Quantity
    WHERE ProductID = @ProductID;
    
    SELECT
        SCOPE_IDENTITY() AS OrderID,
        P.ProductName,
        @TotalPrice AS TotalPrice

    FROM Products P
    WHERE P.ProductID = @ProductID;

END
GO


CREATE PROCEDURE ConfirmTransaction
    @ProductID INT,
    @Quantity INT,
    @TotalAmount DECIMAL(10,2),
    @BuyerID INT
AS
BEGIN
    IF EXISTS (
        SELECT 1
        FROM Users
        WHERE id = @BuyerID
        AND (WalletBalance < @TotalAmount OR WalletBalance IS NULL)
    )
    BEGIN
        RAISERROR('Not enough money available', 16, 1);
        RETURN;
    END

    INSERT INTO Transactions(
        ProductID,
        BuyerID,
        Quantity,
        TotalAmount
    )
    VALUES(
        @ProductID,
        @BuyerID,
        @Quantity,
        @TotalAmount
    );

    UPDATE Users
    SET WalletBalance = WalletBalance - @TotalAmount
    WHERE id = @BuyerID;
    
END
GO

