var AuctionContract = artifacts.require("AuctionContract");

contract('AuctionContract - testing creating new contract', function (accounts) {
    var instance;

    it("Should create a new contract with the sender as the operator and 10 percent taxPercent", async () => {

        instance = await AuctionContract.new(10, { from: accounts[0] });

        //get operator and taxPercent
        const operator = await instance.operator.call();
        const taxPercent = await instance.taxPercent.call();

        // make assertions
        assert.equal(operator, accounts[0], "Wrong product owner");
        assert.equal(taxPercent, 10, "Wrong taxpercent");
    });

    it("Should fail because of too high taxPercent", async () => {
        try {
            instance = await AuctionContract.new(159, { from: accounts[0] });
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (error) {
            assert.equal(error.reason, "The tax percent should be between 0 and 99!");
        }
    });

});