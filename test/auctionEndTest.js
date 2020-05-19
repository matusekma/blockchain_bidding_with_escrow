var AuctionContract = artifacts.require("AuctionContract");

contract('AuctionContract - testing auction end', function (accounts) {

    let instance;

    beforeEach(async function () {
        instance = await AuctionContract.new(10, { from: accounts[0] });
        await instance.addProduct("testProduct0", 5, 100, { from: accounts[1] });
    });

    it("Should fail because no product with the given id", async () => {
        try{        
            //auction end
            await instance.auctionEnd(2);
            assert.equal(0, 1, "The code should not reach this line.");
        }catch(error){
            assert.equal(error.reason, "No product with the given id!");                               
        }
    });

    it("Should fail because the auction not yet ended.", async () => {
        try{        
            //auction end
            await instance.auctionEnd(1);
            assert.equal(0, 1, "The code should not reach this line.");
        }catch(error){
            assert.equal(error.reason, "Auction not yet ended.");                               
        }
    });

    it("Should close auction successfully.", async () => {

        await instance.bid(1, { from: accounts[2], value: web3.utils.toWei('10', 'ether') });
        await instance.bid(1, { from: accounts[3], value: web3.utils.toWei('20', 'ether') });

        const operatorBalance1=Number(await web3.eth.getBalance(accounts[0]));
        const bidder1Balance1=Number(await web3.eth.getBalance(accounts[2]));
        const bidder2Balance1=await web3.eth.getBalance(accounts[3]);
        const ownerBalance1=Number(await web3.eth.getBalance(accounts[1]));

        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        await timeout(5000);

       

        await instance.auctionEnd(1, {from: accounts[4]});

       

        const id = (await instance.productIds.call(0)).toNumber();
        const product =await instance.products.call(1);
        assert.equal(product.id, 0, "Product is not deleted");
        assert.equal(product.owner, '0x0000000000000000000000000000000000000000', "Product is not deleted");
        assert.equal(id, 0, "The id of the product is not deleted");

        const bid1 =(await instance.getMyBid(1, {from: accounts[2]})).toString();
        assert.equal(bid1, web3.utils.toWei('0', 'ether'), "Bid is not deleted");

        const bid2 =(await instance.getMyBid(1, {from: accounts[3]})).toString();
        assert.equal(bid2, web3.utils.toWei('0', 'ether'), "Bid is not deleted");

        const bidder =await instance.bidders.call(1,0);
        assert.equal(bidder, '0x0000000000000000000000000000000000000000', "The list of bidders is not deleted");

        const bidder2 =await instance.bidders.call(1,1);
        assert.equal(bidder2, '0x0000000000000000000000000000000000000000', "The list of bidders is not deleted");

        const operatorBalance2=await web3.eth.getBalance(accounts[0]);
        const bidder1Balance2=await web3.eth.getBalance(accounts[2]);
        const bidder2Balance2=await web3.eth.getBalance(accounts[3]);
        const ownerBalance2=await web3.eth.getBalance(accounts[1]);
        
        const operatorBalance2e=(await operatorBalance1+2000000000000000000).toString();
        const bidder1Balance2e=(await bidder1Balance1+10000000000000000000).toString();
        const ownerBalance2e=(await ownerBalance1+18000000000000000000).toString();
        assert.equal(operatorBalance2, operatorBalance2e, "Wrong operator balance");
        assert.equal(bidder1Balance2, bidder1Balance2e, "Wrong bidder1 balance");
        assert.equal(bidder2Balance2, bidder2Balance1, "Wrong bidder2 balance");
        assert.equal(ownerBalance2, ownerBalance2e, "Wrong owner balance");

        var win=false;
        await instance.getPastEvents('allEvents',
            //{filter: {winner: accounts[3]}},
            (error, events)=>{ 
                console.log(events); 
                //win=true;
            }
        );
        //assert.equal(win, true, "Not the winner we expect");
    });


});