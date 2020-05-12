pragma solidity >=0.5.0;

contract AuctionContract {
    address payable public operator;
    struct Product {
        uint id;
        string name;
        address payable owner;
        uint expiry;
        uint minPrice;
    }

    struct ProductBid {
        mapping(address => uint) bids;
        address highestBidder;
        uint highestBid;
    }

    // products by id
    mapping(uint => Product) public products;
    uint[] public productIds;
    
    // bids by product id
    mapping(uint => ProductBid) productBids;
    mapping(uint => address payable[]) bidders;
    
    uint productId = 1;

    uint public taxPercent;

    constructor(uint taxP) public {
        require(taxP <= 99 && taxP >= 0, "The tax percent should be between 0 and 99!");
        operator = msg.sender;
        taxPercent = taxP;
    }

    modifier onlyOperator {
        require(msg.sender == operator, "Only the operator of this contract can do this operaration!");
        _;
    }

    // setting taxPercent - optional
    /*function setTaxPercent(uint newTaxPercent) public onlyOperator {
        require(newTaxPercent < 100, "The tax must be lower than 100%!");
        taxPercent = newTaxPercent;
    }*/
    
    //event HighestBidIncreased(address bidder, uint amount);
    event AuctionEnded(address winner, uint amount, uint productId);

    function addProduct(string memory name, uint biddingTime, uint minPrice) public {
        require(biddingTime > 0, "The bid should last longer than 0 seconds!");
        require((minPrice * taxPercent) / 100 > 0, "The product should cost more!");
        productIds.push(productId);
        products[productId] = Product(productId, name, msg.sender, now + biddingTime, minPrice);
        productId++;
    }
    
    function getCurrentProductBid(uint id) public view returns (uint) {
        require(productBids[id].highestBidder != address(0x0), "No bid for this product yet!");
        return productBids[id].highestBid;
    }

    function bid(uint id) public payable {
        require(products[id].id > 0, "No product with the given id!");

        Product memory product = products[id];
        require(now <= product.expiry,"Auction already ended.");

        ProductBid storage productBid = productBids[id];
        uint prevBid = productBid.bids[msg.sender];
        uint currentBid = prevBid + msg.value;
        require(currentBid >= product.minPrice, "Your bid is lower than the minimal price!");
        require(currentBid > productBid.highestBid, "There already is a higher or equal bid.");
        
        productBid.bids[msg.sender] = currentBid;
        if(prevBid == 0) {
            bidders[id].push(msg.sender);
        }
        productBid.highestBidder = msg.sender;
        productBid.highestBid = currentBid;
    }

    //Lejárt licit kezelése - győztes elmentése termékkel együtt, termék kitörlése a hirdetésekből, pénz visszaadása, eladónak átutalás (- közvetítői díj magunknak)
    function auctionEnd(uint id) public returns (address) {
        require(products[id].id > 0, "No product with the given id!");
        Product memory product = products[id];
        require(now >= product.expiry,"Auction not yet ended.");
        // require(msg.sender == product.owner, "Only the owner of the product can end the action!");
        ProductBid storage productBid = productBids[id];
        address winner = productBid.highestBidder;
        uint winnerBid = productBid.highestBid;
        address payable productOwner = product.owner;
        
        // DELETE PRODUCT TO AVOID RE-ENTRANCY!!!
        delete products[id];
        uint productIndex = 0;
        while (productIndex < productIds.length) {
            if (productIds[productIndex] == id) {
                break;
            }
            productIndex++;
        }
        delete productIds[productIndex];

        if (winner != address(0x0)) {
            emit AuctionEnded(winner, winnerBid, id);
            
            uint tax = (winnerBid * taxPercent) / 100;
            operator.transfer(tax);
            productOwner.transfer(winnerBid - tax);

            address payable[] storage productBidders = bidders[id];
            for (uint i = 0; i < productBidders.length; ++i) {
                address payable bidder = productBidders[i];
                if (bidder != winner) {
                    bidder.transfer(productBid.bids[bidder]);
                }
            }
            delete productBids[id];
        }
        return winner;
    }
}