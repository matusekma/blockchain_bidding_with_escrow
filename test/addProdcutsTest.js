/*function addProduct(string memory name, uint biddingTime, uint minPrice) public {
    require(biddingTime > 0, "The bid should last longer than 0 seconds!");
    require(minPrice.mul(taxPercent) / 100 > 0, "The product should cost more!");
    productIds.push(productId);
    products[productId] = Product(productId, name, msg.sender, now.add(biddingTime), minPrice);
    productId.add(1);
}*/

var AuctionContract = artifacts.require("AuctionContract");

contract('AuctionContract - testing adding products', function (accounts) {

    let instance;

    beforeEach(async function () {
        instance = await AuctionContract.new(10);
    });

    it("Should add 1 product with correct data", async () => {
        // add product
        await instance.addProduct("testProduct", 60, 100, { from: accounts[0] });

        // get product
        const productId = (await instance.productIds.call(0)).toNumber();
        const product = await instance.products.call(productId);

        // make assertions
        assert.equal(product.name.toString(), "testProduct", "Wrong product name");
        assert.isAbove(product.expiry.toNumber(), 0, "Wrong product expiry");
        assert.equal(product.minPrice.toNumber(), 100, "Wrong product minimal price");
        assert.equal(product.owner, accounts[0], "Wrong product owner");
    });

    it("Should add 2 products with correct data", async () => {
        // add products
        await instance.addProduct("testProduct1", 60, 100, { from: accounts[0] });
        await instance.addProduct("testProduct2", 600, 200, { from: accounts[1] });

        // get product
        const productId1 = (await instance.productIds.call(0)).toNumber();
        const productId2 = (await instance.productIds.call(1)).toNumber();

        const product1 = await instance.products.call(productId1);
        const product2 = await instance.products.call(productId2);

        // make assertions
        assert.equal(productId1 + 1, productId2, "Wrong productIds"); // testing increment
        assert.equal(product1.name.toString(), "testProduct1", "Wrong product1 name");
        assert.equal(product2.name.toString(), "testProduct2", "Wrong product2 name");
        assert.isAbove(product1.expiry.toNumber(), 0, "Wrong product1 expiry");
        assert.isAbove(product2.expiry.toNumber(), 0, "Wrong product2 expiry");
        assert.equal(product1.minPrice.toNumber(), 100, "Wrong product1 minimal price");
        assert.equal(product2.minPrice.toNumber(), 200, "Wrong product2 minimal price");
        assert.equal(product1.owner, accounts[0], "Wrong product1 owner");
        assert.equal(product2.owner, accounts[1], "Wrong product2 owner");
    });

    it("Should fail to add product because of 0 biddingTime", async () => {
        // add product
        try {
            await instance.addProduct("testProduct", 0, 100);
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "The bid should last longer than 0 seconds!");
        }
    });

    /*it("Should fail to add product because of tax not reaching 1 wei", async () => {
        // add product
        try {
            await instance.addProduct("testProduct", 60, 1);
            assert.equal(0, 1, "The code should not reach this line.");
        } catch (err) {
            assert.equal(err.reason, "The product should cost more!");
        }
    });*/
});