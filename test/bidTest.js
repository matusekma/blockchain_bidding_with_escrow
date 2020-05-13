var AuctionContract = artifacts.require("AuctionContract");

/*
function bid(uint id) public payable {
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
*/
contract('AuctionContract - testing adding products', function (accounts) {

    let instance;

    beforeEach(async function () {
        instance = await AuctionContract.new(10);
    });

    it("Should fail because of non-existing product", async () => {
        try {
            // attempt bid
            await instance.bid(1, { from: accounts[0], value: web3.utils.toWei('10', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "No product with the given id!");
        }
    });

    it("Should fail because expired auction", async () => {
        // add product
        await instance.addProduct("testProduct", 1, 100);

        // attempt bid
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        await timeout(5000);

        try {
            await instance.bid(1, { from: accounts[0], value: web3.utils.toWei('10', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "Auction already ended.");
        }

    });

    it("Should fail because of too small bid", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('100', 'ether'));

        try {
            await instance.bid(1, { from: accounts[0], value: web3.utils.toWei('10', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "Your bid is lower than the minimal price!");
        }

    });
});