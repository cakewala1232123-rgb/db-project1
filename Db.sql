USE project;
GO

-- Drop triggers
IF OBJECT_ID('trg_SetDefaultPfp', 'TR') IS NOT NULL DROP TRIGGER trg_SetDefaultPfp;
IF OBJECT_ID('trg_AutoCapitalizeNames', 'TR') IS NOT NULL DROP TRIGGER trg_AutoCapitalizeNames;
IF OBJECT_ID('trg_UpdateProductStock', 'TR') IS NOT NULL DROP TRIGGER trg_UpdateProductStock;
IF OBJECT_ID('trg_UpdateWalletOnTransaction', 'TR') IS NOT NULL DROP TRIGGER trg_UpdateWalletOnTransaction;
GO

-- Drop views
IF OBJECT_ID('vw_ProductList', 'V') IS NOT NULL DROP VIEW vw_ProductList;
IF OBJECT_ID('vw_OrderSummary', 'V') IS NOT NULL DROP VIEW vw_OrderSummary;
GO

-- Drop procedures
IF OBJECT_ID('SendMessage', 'P') IS NOT NULL DROP PROCEDURE SendMessage;
IF OBJECT_ID('OpenChat', 'P') IS NOT NULL DROP PROCEDURE OpenChat;
IF OBJECT_ID('GetMessages', 'P') IS NOT NULL DROP PROCEDURE GetMessages;
IF OBJECT_ID('GetChatById', 'P') IS NOT NULL DROP PROCEDURE GetChatById;
IF OBJECT_ID('GetChats', 'P') IS NOT NULL DROP PROCEDURE GetChats;
IF OBJECT_ID('ConfirmTransaction', 'P') IS NOT NULL DROP PROCEDURE ConfirmTransaction;
IF OBJECT_ID('PlaceOrder', 'P') IS NOT NULL DROP PROCEDURE PlaceOrder;
IF OBJECT_ID('ViewOrderDetail', 'P') IS NOT NULL DROP PROCEDURE ViewOrderDetail;
IF OBJECT_ID('ViewMyOrders', 'P') IS NOT NULL DROP PROCEDURE ViewMyOrders;
IF OBJECT_ID('RemoveProduct', 'P') IS NOT NULL DROP PROCEDURE RemoveProduct;
IF OBJECT_ID('ViewProductById', 'P') IS NOT NULL DROP PROCEDURE ViewProductById;
IF OBJECT_ID('ViewMyProducts', 'P') IS NOT NULL DROP PROCEDURE ViewMyProducts;
IF OBJECT_ID('ViewProducts', 'P') IS NOT NULL DROP PROCEDURE ViewProducts;
IF OBJECT_ID('AddProduct', 'P') IS NOT NULL DROP PROCEDURE AddProduct;
IF OBJECT_ID('UpdateProfile', 'P') IS NOT NULL DROP PROCEDURE UpdateProfile;
IF OBJECT_ID('GetUserProfile', 'P') IS NOT NULL DROP PROCEDURE GetUserProfile;
IF OBJECT_ID('LoginUser', 'P') IS NOT NULL DROP PROCEDURE LoginUser;
IF OBJECT_ID('InsertUser', 'P') IS NOT NULL DROP PROCEDURE InsertUser;
GO

-- Drop tables
IF OBJECT_ID('ChatMessages', 'U') IS NOT NULL DROP TABLE ChatMessages;
IF OBJECT_ID('Chats', 'U') IS NOT NULL DROP TABLE Chats;
IF OBJECT_ID('Transactions', 'U') IS NOT NULL DROP TABLE Transactions;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products;
IF OBJECT_ID('Categories', 'U') IS NOT NULL DROP TABLE Categories;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
GO

-- Users table
CREATE TABLE Users(
    id INT PRIMARY KEY IDENTITY(1,1),
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    fname VARCHAR(100),
    lname VARCHAR(100),
    phone VARCHAR(11),
    pfp VARCHAR(200),
    WalletBalance DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_phone CHECK (phone IS NULL OR phone LIKE '03[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    CONSTRAINT chk_email CHECK (email LIKE '%_@_%.__%'),
    CONSTRAINT chk_password CHECK (LEN(password) >= 8)
);
GO

-- Categories table
CREATE TABLE Categories(
    CategoryID INT PRIMARY KEY IDENTITY(1,1),
    CategoryName VARCHAR(100) NOT NULL
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

-- Products table
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

    CONSTRAINT chk_price CHECK (Price >= 0),
    CONSTRAINT chk_quantity CHECK (Quantity >= 0),
    CONSTRAINT fk_products_seller FOREIGN KEY (SellerID) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_products_category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);
GO

-- Orders table
CREATE TABLE Orders(
    OrderID INT PRIMARY KEY IDENTITY(1,1),
    ProductID INT NOT NULL,
    BuyerID INT NOT NULL,
    Quantity INT DEFAULT 1,
    TotalPrice DECIMAL(10,2) NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_order_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_total_price CHECK (TotalPrice >= 0),
    CONSTRAINT fk_orders_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    CONSTRAINT fk_orders_buyer FOREIGN KEY (BuyerID) REFERENCES Users(id)
);
GO

-- Transactions table
CREATE TABLE Transactions(
    TransactionID INT PRIMARY KEY IDENTITY(1,1),
    OrderID INT NULL,
    ProductID INT NOT NULL,
    BuyerID INT NOT NULL,
    Quantity INT DEFAULT 1,
    TotalAmount DECIMAL(10,2) NOT NULL,
    TransactionDate DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_transaction_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_transaction_total_amount CHECK (TotalAmount >= 0),
    CONSTRAINT fk_transactions_order FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT fk_transactions_product FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_buyer FOREIGN KEY (BuyerID) REFERENCES Users(id)
);
GO

-- Chats table
CREATE TABLE Chats (
    ChatID INT PRIMARY KEY IDENTITY(1,1),
    ChatName VARCHAR(30),
    User1ID INT NOT NULL,
    User2ID INT NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_chat_user1 FOREIGN KEY (User1ID) REFERENCES Users(id) ON DELETE NO ACTION,
    CONSTRAINT fk_chat_user2 FOREIGN KEY (User2ID) REFERENCES Users(id) ON DELETE NO ACTION
);
GO

-- ChatMessages table
CREATE TABLE ChatMessages (
    MessageID INT PRIMARY KEY IDENTITY(1,1),
    ChatID INT NOT NULL,
    SenderID INT NOT NULL,
    MessageText VARCHAR(1000) NOT NULL,
    SentAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_chatmessages_chat FOREIGN KEY (ChatID) REFERENCES Chats(ChatID) ON DELETE CASCADE,
    CONSTRAINT fk_chatmessages_sender FOREIGN KEY (SenderID) REFERENCES Users(id)
);
GO

-- Views
CREATE VIEW vw_ProductList
AS
SELECT 
    P.ProductID, P.ProductName, P.Description, P.Price, P.Quantity, P.ImageURL,
    P.SellerID, U.email AS SellerEmail, U.fname + ' ' + U.lname AS SellerName,
    P.CategoryID, C.CategoryName, P.CreatedAt
FROM Products P
LEFT JOIN Users U ON P.SellerID = U.id
LEFT JOIN Categories C ON P.CategoryID = C.CategoryID;
GO

CREATE VIEW vw_OrderSummary
AS
SELECT 
    O.OrderID, O.Quantity, O.TotalPrice, O.OrderDate,
    O.ProductID, P.ProductName, P.Description, P.ImageURL, P.Price AS UnitPrice, P.SellerID,
    O.BuyerID,
    SU.fname, SU.lname, SU.phone, SU.email AS SellerEmail,
    C.CategoryID, C.CategoryName,
    T.TransactionID, T.TotalAmount, T.TransactionDate
FROM Orders O
JOIN Products P ON O.ProductID = P.ProductID
JOIN Users SU ON P.SellerID = SU.id
LEFT JOIN Categories C ON P.CategoryID = C.CategoryID
LEFT JOIN Transactions T ON T.OrderID = O.OrderID;
GO

-- Triggers
CREATE TRIGGER trg_AutoCapitalizeNames
ON Users
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE U
    SET fname = UPPER(LEFT(i.fname, 1)) + LOWER(SUBSTRING(i.fname, 2, LEN(i.fname))),
        lname = UPPER(LEFT(i.lname, 1)) + LOWER(SUBSTRING(i.lname, 2, LEN(i.lname)))
    FROM Users U
    INNER JOIN inserted i ON U.id = i.id
    WHERE i.fname IS NOT NULL AND LEN(i.fname) > 0
       OR i.lname IS NOT NULL AND LEN(i.lname) > 0;
END
GO

CREATE TRIGGER trg_SetDefaultPfp
ON Users
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE U
    SET pfp = 'https://via.placeholder.com/120'
    FROM Users U
    INNER JOIN inserted i ON U.id = i.id
    WHERE i.pfp IS NULL OR i.pfp = '';
END
GO

CREATE TRIGGER trg_UpdateProductStock
ON Orders
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE P
    SET Quantity = P.Quantity - i.Quantity
    FROM Products P
    INNER JOIN inserted i ON P.ProductID = i.ProductID;
END
GO



CREATE TRIGGER trg_UpdateWalletOnTransaction
ON Transactions
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @BuyerID INT, @TotalAmount DECIMAL(10,2), @ProductID INT;
    DECLARE @SellerID INT;

    SELECT @BuyerID = BuyerID, @TotalAmount = TotalAmount, @ProductID = ProductID FROM inserted;

    SELECT @SellerID = SellerID FROM Products WHERE ProductID = @ProductID;

    UPDATE Users SET WalletBalance = WalletBalance - @TotalAmount WHERE id = @BuyerID;
    UPDATE Users SET WalletBalance = WalletBalance + @TotalAmount WHERE id = @SellerID;
END
GO

-- Auth procedures
CREATE PROCEDURE InsertUser
    @email VARCHAR(100),
    @password VARCHAR(100)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT INTO Users(email, password) VALUES(@email, @password);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE LoginUser
    @email VARCHAR(100),
    @password VARCHAR(100)
AS
BEGIN
    SELECT * FROM Users WHERE email = @email AND password = @password
END
GO

-- Product procedures
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
    BEGIN TRY
        BEGIN TRANSACTION;
        IF @ImageURL = '' SET @ImageURL = NULL;
        IF @Description = '' SET @Description = NULL;
        INSERT INTO Products(ProductName, Description, Price, Quantity, ImageURL, SellerID, CategoryID)
        VALUES(@ProductName, @Description, @Price, @Quantity, @ImageURL, @SellerID, @CategoryID);
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE RemoveProduct
    @ProductID INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        DELETE FROM Products WHERE ProductID = @ProductID;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE ViewProducts
    @CategoryID INT = 0,
    @MinPrice DECIMAL(10,2) = 0,
    @MaxPrice DECIMAL(10,2) = 999999,
    @Search VARCHAR(100) = ''
AS
BEGIN
    SELECT * FROM vw_ProductList
    WHERE (@CategoryID = 0 OR CategoryID = @CategoryID)
        AND Price BETWEEN @MinPrice AND @MaxPrice
        AND ProductName LIKE '%' + @Search + '%'
    ORDER BY CreatedAt DESC;
END
GO

CREATE PROCEDURE ViewMyProducts
    @UserID INT,
    @CategoryID INT = 0,
    @MinPrice DECIMAL(10,2) = 0,
    @MaxPrice DECIMAL(10,2) = 999999,
    @Search VARCHAR(100) = ''
AS
BEGIN
    SELECT * FROM vw_ProductList
    WHERE SellerID = @UserID
        AND (@CategoryID = 0 OR CategoryID = @CategoryID)
        AND Price BETWEEN @MinPrice AND @MaxPrice
        AND ProductName LIKE '%' + @Search + '%'
    ORDER BY CreatedAt DESC;
END
GO

CREATE PROCEDURE ViewProductById
    @ProductID INT
AS
BEGIN
    SELECT * FROM vw_ProductList WHERE ProductID = @ProductID;
END
GO

-- Profile procedures
CREATE PROCEDURE UpdateProfile
    @fname VARCHAR(100),
    @lname VARCHAR(100),
    @phone VARCHAR(100),
    @pfp VARCHAR(255),
    @add_wallet DECIMAL(10,2),
    @userId INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;
        IF @pfp = '' SET @pfp = NULL;
        IF @phone = '' SET @phone = NULL;
        IF @fname = '' SET @fname = NULL;
        IF @lname = '' SET @lname = NULL;
        IF @add_wallet IS NULL SET @add_wallet = 0;

        UPDATE Users
        SET fname = @fname, lname = @lname, phone = @phone, pfp = @pfp,
            WalletBalance = WalletBalance + @add_wallet
        WHERE id = @userId;
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE GetUserProfile
    @userId INT
AS
BEGIN
    SELECT 
        U.id, U.email, U.fname, U.lname, U.phone, U.pfp, U.WalletBalance,
        (SELECT COUNT(*) FROM Products P WHERE P.SellerID = U.id) AS ProductsCount,
        (SELECT COUNT(*) FROM Orders O WHERE O.BuyerID = U.id) AS OrdersCount
    FROM Users U
    WHERE U.id = @userId;
END
GO

-- Order procedures
CREATE PROCEDURE PlaceOrder
    @ProductID INT,
    @BuyerID INT,
    @Quantity INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Price DECIMAL(10,2);
        DECLARE @Stock INT;
        DECLARE @TotalPrice DECIMAL(10,2);
        DECLARE @NewOrderID INT;

        SELECT @Price = Price, @Stock = Quantity FROM Products WHERE ProductID = @ProductID;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR('Product not found', 16, 1);
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM Products WHERE ProductID = @ProductID AND SellerID = @BuyerID)
        BEGIN
            RAISERROR('You cannot buy your own product', 16, 1);
            RETURN;
        END

        IF @Stock < @Quantity
        BEGIN
            RAISERROR('Not enough stock available', 16, 1);
            RETURN;
        END

        SET @TotalPrice = @Price * @Quantity;

        INSERT INTO Orders(ProductID, BuyerID, Quantity, TotalPrice)
        VALUES(@ProductID, @BuyerID, @Quantity, @TotalPrice);

        SET @NewOrderID = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;

        SELECT @NewOrderID AS OrderID, P.ProductName, @TotalPrice AS TotalPrice
        FROM Products P WHERE P.ProductID = @ProductID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE ConfirmTransaction
    @OrderID INT,
    @ProductID INT,
    @Quantity INT,
    @TotalAmount DECIMAL(10,2),
    @BuyerID INT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM Transactions WHERE OrderID = @OrderID)
        BEGIN
            RAISERROR('Transaction already exists for this order', 16, 1);
            RETURN;
        END

        IF EXISTS (SELECT 1 FROM Users WHERE id = @BuyerID AND WalletBalance < @TotalAmount)
        BEGIN
            RAISERROR('Not enough money available', 16, 1);
            RETURN;
        END

        INSERT INTO Transactions(OrderID, ProductID, BuyerID, Quantity, TotalAmount)
        VALUES(@OrderID, @ProductID, @BuyerID, @Quantity, @TotalAmount);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- My Orders procedures
CREATE PROCEDURE ViewMyOrders
    @UserID INT,
    @CategoryID INT = 0,
    @MinPrice DECIMAL(10,2) = 0,
    @MaxPrice DECIMAL(10,2) = 999999,
    @Search VARCHAR(100) = ''
AS
BEGIN
    SELECT * FROM vw_OrderSummary
    WHERE BuyerID = @UserID
        AND (@CategoryID = 0 OR CategoryID = @CategoryID)
        AND TotalPrice BETWEEN @MinPrice AND @MaxPrice
        AND ProductName LIKE '%' + @Search + '%'
    ORDER BY OrderDate DESC;
END
GO

CREATE PROCEDURE ViewOrderDetail
    @OrderID INT
AS
BEGIN
    SELECT * FROM vw_OrderSummary WHERE OrderID = @OrderID;
END
GO

-- Chat procedures
CREATE PROCEDURE OpenChat
    @User1ID INT,
    @User2ID INT,
    @ChatName VARCHAR(30)
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM Chats
            WHERE (User1ID = @User1ID AND User2ID = @User2ID) 
               OR (User1ID = @User2ID AND User2ID = @User1ID)
        )
        BEGIN
            INSERT INTO Chats(User1ID, User2ID, ChatName) VALUES(@User1ID, @User2ID, @ChatName);
        END

        COMMIT TRANSACTION;

        SELECT ChatID FROM Chats
        WHERE (User1ID = @User1ID AND User2ID = @User2ID) 
           OR (User1ID = @User2ID AND User2ID = @User1ID);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE PROCEDURE SendMessage
    @SenderID INT,
    @ChatID INT,
    @MessageText VARCHAR(1000)
AS
BEGIN
    INSERT INTO ChatMessages(ChatID, SenderID, MessageText)
    VALUES(@ChatID, @SenderID, @MessageText);
END
GO

CREATE PROCEDURE GetChats
    @UserID INT
AS
BEGIN
    SELECT 
        C.ChatID, C.ChatName,
        CASE WHEN C.User1ID = @UserID THEN C.User2ID ELSE C.User1ID END AS OtherUserID,
        U.fname + ' ' + U.lname AS OtherUserName
    FROM Chats C
    JOIN Users U ON U.id = CASE WHEN C.User1ID = @UserID THEN C.User2ID ELSE C.User1ID END
    WHERE C.User1ID = @UserID OR C.User2ID = @UserID;
END
GO

CREATE PROCEDURE GetChatById
    @ChatID INT,
    @UserID INT
AS
BEGIN
    SELECT
        C.ChatID, C.ChatName,
        CASE WHEN C.User1ID = @UserID THEN C.User2ID ELSE C.User1ID END AS OtherUserID,
        U.fname + ' ' + U.lname AS OtherUserName, U.pfp
    FROM Chats C
    JOIN Users U ON U.id = CASE WHEN C.User1ID = @UserID THEN C.User2ID ELSE C.User1ID END
    WHERE C.ChatID = @ChatID;
END
GO

CREATE PROCEDURE GetMessages
    @ChatID INT
AS
BEGIN
    SELECT M.MessageID, M.ChatID, M.SenderID, M.MessageText, M.SentAt,
           U.fname + ' ' + U.lname AS SenderName
    FROM ChatMessages M
    JOIN Users U ON M.SenderID = U.id
    WHERE M.ChatID = @ChatID
    ORDER BY M.SentAt ASC;
END
GO













-- Test Users (password is "password123" for all)
INSERT INTO Users(email, password) VALUES('abc@gmail.com', 'password123');
INSERT INTO Users(email, password) VALUES('bbc@gmail.com', 'password123');
INSERT INTO Users(email, password) VALUES('cbc@gmail.com', 'password123');
GO

-- Update profiles (triggers will auto-capitalize and set default pfp)
UPDATE Users SET fname = 'ahmed', lname = 'khan', phone = '03001234567', WalletBalance = 5000 WHERE email = 'abc@gmail.com';
UPDATE Users SET fname = 'bilal', lname = 'saleem', phone = '03009876543', WalletBalance = 3000 WHERE email = 'bbc@gmail.com';
UPDATE Users SET fname = 'camran', lname = 'iqbal', phone = '03005554433', WalletBalance = 7000 WHERE email = 'cbc@gmail.com';
GO

-- Products (SellerID 1 = abc, SellerID 2 = bbc, SellerID 3 = cbc)
INSERT INTO Products(ProductName, Description, Price, Quantity, ImageURL, SellerID, CategoryID)
VALUES('Calculus Book', 'Calculus early transcendentals 8th edition', 500, 3, 'https://via.placeholder.com/200', 1, 1);

INSERT INTO Products(ProductName, Description, Price, Quantity, ImageURL, SellerID, CategoryID)
VALUES('Wireless Mouse', 'Logitech wireless mouse black', 1200, 5, 'https://via.placeholder.com/200', 2, 2);

INSERT INTO Products(ProductName, Description, Price, Quantity, ImageURL, SellerID, CategoryID)
VALUES('Notebook Set', 'Pack of 5 ruled notebooks', 300, 10, 'https://via.placeholder.com/200', 3, 3);

INSERT INTO Products(ProductName, Description, Price, Quantity, ImageURL, SellerID, CategoryID)
VALUES('Hoodie', 'Black hoodie size large', 1500, 2, 'https://via.placeholder.com/200', 1, 4);

INSERT INTO Products(ProductName, Description, Price, Quantity, ImageURL, SellerID, CategoryID)
VALUES('Badminton Racket', 'Yonex badminton racket', 2500, 4, 'https://via.placeholder.com/200', 2, 6);
GO

-- Orders (BuyerID 2 = bbc buys from abc, BuyerID 3 = cbc buys from bbc)
-- abc buys from bbc
-- bbc buys from cbc
-- cbc buys from abc
EXEC PlaceOrder @ProductID = 1, @BuyerID = 2, @Quantity = 1;  -- bbc buys Calculus Book from abc
EXEC PlaceOrder @ProductID = 2, @BuyerID = 3, @Quantity = 2;  -- cbc buys Wireless Mouse from bbc
EXEC PlaceOrder @ProductID = 3, @BuyerID = 1, @Quantity = 1;  -- abc buys Notebook Set from cbc
GO
