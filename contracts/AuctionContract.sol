pragma solidity >=0.6.0;

import "../node_modules/@openzeppelin/contracts/math/SafeMath.sol";

contract AuctionContract {
    using SafeMath for uint256;
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
    // TODO - remove public in production
    mapping(uint => ProductBid) public productBids;
    mapping(uint => address payable[]) public bidders;

    mapping(address => uint) private failedPaybacks;

    uint productId = 1;

    uint public taxPercent;

    constructor(uint taxP) public {
        require(taxP <= 99, "The tax percent should be between 0 and 99!");
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

    event AuctionEnded(address winner, uint amount, uint productId);

    function addProduct(string calldata name, uint biddingTime, uint minPrice) external returns (uint){
        require(biddingTime > 0, "The bid should last longer than 0 seconds!");
        require(minPrice.mul(taxPercent) / 100 > 0, "The product should cost more!");
        productIds.push(productId);
        products[productId] = Product(productId, name, msg.sender, now.add(biddingTime), minPrice);
        uint id = productId;
        productId = productId.add(1);
        return id;
    }

    function getCurrentProductBid(uint id) external view returns (uint) {
        require(productBids[id].highestBidder != address(0x0), "No bid for this product yet!");
        return productBids[id].highestBid;
    }

    function getMyBid(uint id) external view returns (uint) {
        return productBids[id].bids[msg.sender];
    }

    function bid(uint id) external payable {
        require(products[id].id > 0, "No product with the given id!");

        Product memory product = products[id];
        require(now <= product.expiry,"Auction already ended.");

        ProductBid storage productBid = productBids[id];
        uint prevBid = productBid.bids[msg.sender];
        uint currentBid = prevBid.add(msg.value);
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
    function auctionEnd(uint id) external returns (address) {
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
        //

        if (winner != address(0x0)) {
            emit AuctionEnded(winner, winnerBid, id);

            uint tax = winnerBid.mul(taxPercent) / 100;
            operator.transfer(tax);
            productOwner.transfer(winnerBid.sub(tax));

            address payable[] storage productBidders = bidders[id];
            for (uint i = 0; i < productBidders.length; ++i) {
                address payable bidder = productBidders[i];
                if (bidder != winner) {
                    uint payback = productBid.bids[bidder];
                    if(!bidder.send(payback)) {
                        failedPaybacks[bidder] = failedPaybacks[bidder].add(payback);
                    }
                }
            }
            delete productBids[id];
        }
        return winner;
    }

    function getFailedPayback() external {
        require(failedPaybacks[msg.sender] > 0, "You don't have any unpaid bids!");
        uint payback = failedPaybacks[msg.sender];
        failedPaybacks[msg.sender] = 0;
        msg.sender.transfer(payback);
    }
}