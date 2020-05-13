/*function addProduct(string memory name, uint biddingTime, uint minPrice) public {
    require(biddingTime > 0, "The bid should last longer than 0 seconds!");
    require(minPrice.mul(taxPercent) / 100 > 0, "The product should cost more!");
    productIds.push(productId);
    products[productId] = Product(productId, name, msg.sender, now.add(biddingTime), minPrice);
    productId.add(1);
}*/

/*
Termék hozzáadása: - Marci
1 product hozzáadása
2 -||- - legyen jó a productid és 2 product legyen a products mappingben
productIds tömbbe kerüljön be az id
productId változó növekedjen
Tesztesetek:
minPrice jó
minPrice túl kicsi
Jó biddingtime
Rossz biddingtime (nem pozitív)
*/

var AuctionContract = artifacts.require("AuctionContract");

contract('AuctionContract - testing adding products', function (accounts) {

    let instance;

    beforeEach(async function () {
        instance = await AuctionContract.new(10);
    });

    it("Should add 1 product with correct data", async () => {
        // add product
        await instance.addProduct("testProduct", 60, 100);

        // get product
        let productId = (await instance.productIds.call(0)).toNumber();
        let product = await instance.products.call(productId);

        // make assertions
        assert.equal(product.name.toString(), "testProduct");
        assert.isAbove(product.expiry.toNumber(), 0);
        assert.equal(product.minPrice.toNumber(), 100);
    });

    it("Should add 2 products with correct data", async () => {
        // add products
        await instance.addProduct("testProduct1", 60, 100);
        await instance.addProduct("testProduct2", 600, 200);

        // get product
        let productId1 = (await instance.productIds.call(0)).toNumber();
        let productId2 = (await instance.productIds.call(1)).toNumber();

        let product1 = await instance.products.call(productId1);
        let product2 = await instance.products.call(productId2);

        // make assertions
        assert.equal(product1.name.toString(), "testProduct1");
        assert.equal(product2.name.toString(), "testProduct2");
        assert.isAbove(product1.expiry.toNumber(), 0);
        assert.isAbove(product2.expiry.toNumber(), 0);
        assert.equal(product1.minPrice.toNumber(), 100);
        assert.equal(product2.minPrice.toNumber(), 200);
    });

    it("Should fail to add product because of negative expiry", async () => {
        // add product
        try {
            await instance.addProduct("testProduct", -60, 100);
        } catch (err) {
            assert.equal(err.reason, "SafeMath: addition overflow")
        }
    });

    //TODO handle negative values properly
    /*
    it("Should fail to add product because of negative minimal price", async () => {
        // add product
        try {
            await instance.addProduct("testProduct", 60, -100);
        } catch (err) {
            assert.equal(err.reason, "SafeMath: addition overflow")
        }
    });*/
});