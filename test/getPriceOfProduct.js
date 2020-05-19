var AuctionContract = artifacts.require("AuctionContract");

contract('AuctionContract - testing getCurrentBid function', function (accounts) {

    let instance;

    beforeEach(async function () {
        instance = await AuctionContract.new(10);
        await instance.addProduct("testProduct0", 60, 100, { from: accounts[0] });
    });

    it("Should fail because of non-existing bid", async () => {
        try{        
            //get the current bid
            await instance.getCurrentProductBid(1);
            assert.equal(0, 1, "The code should not reach this line.");
        }catch(error){
            assert.equal(error.message, 'Returned error: VM Exception while processing transaction: revert No bid for this product yet or no product with the given id!');                               
        }
    });

    it("Should fail because no product with the given id", async () => {
        try{        
            //get the current bid
            await instance.getCurrentProductBid(12);
            assert.equal(0, 1, "The code should not reach this line.");
        }catch(error){
            assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert No bid for this product yet or no product with the given id!");                               
        }
    });

    it("Should get the current highest bid of the product", async () => {
        
        await instance.bid(1, { from: accounts[0], value: web3.utils.toWei('10', 'ether') });
        
        //get the current bid
        const currentbid= await instance.getCurrentProductBid(1);

        // make assertions
        assert.equal(currentbid, web3.utils.toWei('10', 'ether'), "Wrong bid");
    });
});