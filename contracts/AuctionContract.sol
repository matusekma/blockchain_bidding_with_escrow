pragma solidity ^0.5.0;

contract BiddingContract {
    address owner;
    struct Product {
        uint id;
        string name;
        address owner;
        uint expiry;
        uint minPrice;
        bool isSold;
    }

    struct ProductBid {
        mapping(address => uint) bids;
        address highestBidder;
        uint highestBid;
    }

    struct Purchase {
        uint productId;
        address winner;
        uint price;
    }

    // products by id
    mapping(uint => Product) public products;
    uint[] public productIds;
    
    // bids by product id
    mapping(uint => ProductBid) productBids;
    mapping(uint => address[]) bidders;
    
    // sold products
    Purchase[] public purchaseHistory;
    
    uint productId = 1;
    
    constructor() public {
        owner = msg.sender;
    }

    function addProduct(string memory name, uint biddingTime, uint minPrice) public {
        productIds.push(productId);
        products[productId] = Product(productId, name, msg.sender, now + biddingTime, minPrice, false);
        productId++;
    }
    
    function getCurrentProductBid(uint id) public view returns (uint) {
        require(productBids[id].highestBid > 0, "No bid for this product yet!");
        return productBids[id].highestBid;
    }

    function bid(uint id) public payable {
        require(products[id].id > 0, "No product with the given id!");

        Product memory product = products[id];
        require(now <= product.expiry,"Auction already ended.");

        ProductBid storage productBid = productBids[id];
        uint prevBid = productBid.bids[msg.sender];
        uint currentBid = prevBid + msg.value;
        require(currentBid >= product.minPrice, "Your bid is lower then the minimal price!");
        require(currentBid > productBid.highestBid, "There already is a higher or equal bid.");
        
        productBid.bids[msg.sender] = currentBid;
        if(prevBid == 0) {
            bidders[id].push(msg.sender);
        }
        productBid.highestBidder = msg.sender;
        productBid.highestBid = currentBid;
    }

}