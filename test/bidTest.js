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

    it("Should fail because of expired auction", async () => {
        // add product
        await instance.addProduct("testProduct", 1, web3.utils.toWei('100', 'ether'), { from: accounts[0] });

        // attempt bid
        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        await timeout(5000);

        try {
            await instance.bid(1, { from: accounts[1], value: web3.utils.toWei('10', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "Auction already ended.");
        }
    });

    it("Should fail because of bid smaller than minPrice", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('100', 'ether'), { from: accounts[0] });
        const ID = 1;

        try {
            await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('10', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "Your bid is lower than the minimal price!");
        }
    });

    it("Should bid successfully for the first time", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('10', 'ether'), { from: accounts[0] });

        //make bid
        const ID = 1;
        await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('11', 'ether') });

        const productBid = await instance.productBids.call(ID);

        // make assertions
        assert.equal(productBid.highestBidder, accounts[1], "Wrong highestBidder");
        const highestBid = await instance.getCurrentProductBid(ID);
        assert.equal(highestBid, web3.utils.toWei('11', 'ether'), "Wrong highestBid");
        const account1Bid = await instance.getMyBid(ID, { from: accounts[1] });
        assert.equal(account1Bid, web3.utils.toWei('11', 'ether'), "Wrong bid in the bids mapping")
    });

    it("Should bid successfully for the second time", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('10', 'ether'), { from: accounts[0] });

        //make bids from account 1 and 2 and 1 again
        const ID = 1;
        await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('11', 'ether') });
        await instance.bid(ID, { from: accounts[2], value: web3.utils.toWei('12', 'ether') });
        await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('2', 'ether') });

        const productBid = await instance.productBids.call(ID);

        // make assertions
        assert.equal(productBid.highestBidder, accounts[1], "Wrong highestBidder");
        const highestBid = await instance.getCurrentProductBid(ID);
        assert.equal(highestBid, web3.utils.toWei('13', 'ether'), "Wrong highestBid");
        const account1Bid = await instance.getMyBid(ID, { from: accounts[1] });
        assert.equal(account1Bid, web3.utils.toWei('13', 'ether'), "Wrong bid in the bids mapping")
    });

    it("Should fail because of bid smaller than highestBid", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('10', 'ether'), { from: accounts[0] });

        // bid with account 1
        const ID = 1;
        await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('13', 'ether') });

        // attempt smaller bid with account 2
        try {
            await instance.bid(ID, { from: accounts[2], value: web3.utils.toWei('12', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "There already is a higher or equal bid.");
        }
    });

    it("Should fail bidding for the second time", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('10', 'ether'), { from: accounts[0] });

        //make bids from account 1 and 2
        const ID = 1;
        await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('11', 'ether') });
        await instance.bid(ID, { from: accounts[2], value: web3.utils.toWei('15', 'ether') });

        // attempt too small 2nd bid with account 1
        try {
            await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('1', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "There already is a higher or equal bid.");
        }
    });

    // not actually testing the contract
    it("Should fail because of account not having enough ether", async () => {
        // add product
        await instance.addProduct("testProduct", 600, web3.utils.toWei('10', 'ether'), { from: accounts[0] });

        const ID = 1;
        try {
            await instance.bid(ID, { from: accounts[1], value: web3.utils.toWei('1000', 'ether') });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            // error is caught here
        }
    });
});