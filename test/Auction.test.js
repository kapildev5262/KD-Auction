const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Auction", function () {
    let auction;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    const ITEM_SUBMISSION_FEE = ethers.utils.parseEther("0.005");
    const MINIMUM_BID_INCREMENT = ethers.utils.parseEther("0.01");

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        
        const Auction = await ethers.getContractFactory("Auction");
        auction = await Auction.deploy();
        await auction.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right admin", async function () {
            expect(await auction.getAdmin()).to.equal(owner.address);
        });

        it("Should start with auction inactive", async function () {
            const status = await auction.getAuctionStatus();
            expect(status.isActive).to.equal(false);
        });

        it("Should reject direct transfers", async function () {
            await expect(
                owner.sendTransaction({ to: auction.address, value: ethers.utils.parseEther("1") })
            ).to.be.revertedWith("Direct deposits not accepted");
        });
    });

    describe("Auction Management", function () {
        it("Should start auction with valid duration", async function () {
            await auction.connect(owner).startAuction(60);
            const status = await auction.getAuctionStatus();
            expect(status.isActive).to.equal(true);
        });

        it("Should reject invalid auction duration", async function () {
            await expect(auction.connect(owner).startAuction(0))
                .to.be.revertedWith("Auction__InvalidDuration");
            
            const maxDurationInMinutes = (30 * 24 * 60) + 1; // 30 days + 1 minute
            await expect(auction.connect(owner).startAuction(maxDurationInMinutes))
                .to.be.revertedWith("Auction__InvalidDuration");
        });

        it("Should only allow admin to start auction", async function () {
            await expect(auction.connect(addr1).startAuction(60))
                .to.be.revertedWith("Auction__NotAdmin");
        });
    });

    describe("Item Submission", function () {
        it("Should allow item submission with correct fee", async function () {
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ItemSubmitted');
            expect(event).to.not.be.undefined;
            
            const itemIds = await auction.getAllItemIds();
            expect(itemIds.length).to.equal(1);
        });

        it("Should reject submission with incorrect fee", async function () {
            await expect(
                auction.connect(addr1).submitItem(
                    "Test Item",
                    "Description",
                    ethers.utils.parseEther("0.1"),
                    { value: ethers.utils.parseEther("0.003") }
                )
            ).to.be.revertedWith("Auction__InsufficientFee");
        });

        it("Should reject empty item details", async function () {
            await expect(
                auction.connect(addr1).submitItem(
                    "",
                    "Description",
                    ethers.utils.parseEther("0.1"),
                    { value: ITEM_SUBMISSION_FEE }
                )
            ).to.be.revertedWith("Auction__InvalidItem");

            await expect(
                auction.connect(addr1).submitItem(
                    "Test Item",
                    "",
                    ethers.utils.parseEther("0.1"),
                    { value: ITEM_SUBMISSION_FEE }
                )
            ).to.be.revertedWith("Auction__InvalidItem");
        });

        it("Should transfer submission fee to admin", async function () {
            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );

            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance.sub(initialBalance)).to.equal(ITEM_SUBMISSION_FEE);
        });
    });

    describe("Item Verification", function () {
        let itemId;

        beforeEach(async function () {
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ItemSubmitted');
            itemId = event.args.itemId;
        });

        it("Should allow admin to verify item", async function () {
            await expect(auction.connect(owner).verifyItem(itemId))
                .to.emit(auction, "ItemVerified")
                .withArgs(itemId);
        });

        it("Should prevent non-admin from verifying", async function () {
            await expect(auction.connect(addr1).verifyItem(itemId))
                .to.be.revertedWith("Auction__NotAdmin");
        });

        it("Should prevent double verification", async function () {
            await auction.connect(owner).verifyItem(itemId);
            await expect(auction.connect(owner).verifyItem(itemId))
                .to.be.revertedWith("Auction__ItemAlreadyVerified");
        });

        it("Should reject verification of non-existent item", async function () {
            const fakeItemId = ethers.utils.id("fake");
            await expect(auction.connect(owner).verifyItem(fakeItemId))
                .to.be.revertedWith("Auction__InvalidItem");
        });
    });

    describe("Bidding Process", function () {
        let itemId;

        beforeEach(async function () {
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'ItemSubmitted');
            itemId = event.args.itemId;
            
            await auction.connect(owner).verifyItem(itemId);
        });

        it("Should accept valid bid", async function () {
            const bidAmount = ethers.utils.parseEther("0.2");
            await expect(auction.connect(addr2).placeBid(itemId, { value: bidAmount }))
                .to.emit(auction, "NewHighestBid")
                .withArgs(itemId, addr2.address, bidAmount);
        });

        it("Should reject bid below minimum increment", async function () {
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });

            await expect(
                auction.connect(addrs[0]).placeBid(itemId, { 
                    value: ethers.utils.parseEther("0.205") 
                })
            ).to.be.revertedWith("Auction__BidTooLow");
        });

        it("Should reject bid below starting price", async function () {
            await expect(
                auction.connect(addr2).placeBid(itemId, { 
                    value: ethers.utils.parseEther("0.05") 
                })
            ).to.be.revertedWith("Auction__BidTooLow");
        });

        it("Should prevent owner from bidding on their item", async function () {
            await expect(
                auction.connect(addr1).placeBid(itemId, { 
                    value: ethers.utils.parseEther("0.2") 
                })
            ).to.be.revertedWith("Auction__SelfBidding");
        });

        it("Should reject bids on unverified items", async function () {
            const tx = await auction.connect(addr1).submitItem(
                "New Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            const newItemId = receipt.events.find(e => e.event === 'ItemSubmitted').args.itemId;

            await expect(
                auction.connect(addr2).placeBid(newItemId, { 
                    value: ethers.utils.parseEther("0.2") 
                })
            ).to.be.revertedWith("Auction__NotVerified");
        });

        it("Should properly handle multiple bids", async function () {
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });

            const bidderBalanceBefore = await auction.getBidderBalance(addr2.address);

            await auction.connect(addrs[0]).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.3") 
            });

            const bidderBalanceAfter = await auction.getBidderBalance(addr2.address);
            expect(bidderBalanceAfter.sub(bidderBalanceBefore))
                .to.equal(ethers.utils.parseEther("0.2"));
        });
    });

    describe("Withdrawal", function () {
        let itemId;

        beforeEach(async function () {
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            itemId = tx.wait().then(r => 
                r.events.find(e => e.event === 'ItemSubmitted').args.itemId
            );
            
            await auction.connect(owner).verifyItem(itemId);
            
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });
            
            await auction.connect(addrs[0]).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.3") 
            });
        });

        it("Should allow outbid users to withdraw", async function () {
            const initialBalance = await ethers.provider.getBalance(addr2.address);
            
            const tx = await auction.connect(addr2).withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            const finalBalance = await ethers.provider.getBalance(addr2.address);
            
            expect(finalBalance.sub(initialBalance))
                .to.equal(ethers.utils.parseEther("0.2").sub(gasUsed));
        });

        it("Should prevent withdrawal with no balance", async function () {
            await expect(auction.connect(addrs[1]).withdraw())
                .to.be.revertedWith("Auction__NoFundsToWithdraw");
        });

        it("Should prevent double withdrawal", async function () {
            await auction.connect(addr2).withdraw();
            await expect(auction.connect(addr2).withdraw())
                .to.be.revertedWith("Auction__NoFundsToWithdraw");
        });
    });

    describe("Auction End", function () {
        let itemId;

        beforeEach(async function () {
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            itemId = receipt.events.find(e => e.event === 'ItemSubmitted').args.itemId;
            
            await auction.connect(owner).verifyItem(itemId);
            
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });
        });

        it("Should allow admin to end auction after duration", async function () {
            await time.increase(3600); // Increase time by 1 hour

            await expect(auction.connect(owner).endAuction(itemId))
                .to.emit(auction, "AuctionEnded")
                .withArgs(itemId, addr2.address, ethers.utils.parseEther("0.2"));
        });

        it("Should prevent non-admin from ending auction", async function () {
            await time.increase(3600);
            await expect(auction.connect(addr1).endAuction(itemId))
                .to.be.revertedWith("Auction__NotAdmin");
        });

        it("Should prevent ending auction before duration", async function () {
            await expect(auction.connect(owner).endAuction(itemId))
                .to.be.revertedWith("Auction__AuctionEnded");
        });

        it("Should transfer funds to item owner on auction end", async function () {
            const initialBalance = await ethers.provider.getBalance(addr1.address);
            
            await time.increase(3600);
            await auction.connect(owner).endAuction(itemId);

            const finalBalance = await ethers.provider.getBalance(addr1.address);
            expect(finalBalance.sub(initialBalance))
                .to.equal(ethers.utils.parseEther("0.2"));
        });

        it("Should prevent ending already ended auction", async function () {
            await time.increase(3600);
            await auction.connect(owner).endAuction(itemId);
            
            await expect(auction.connect(owner).endAuction(itemId))
                .to.be.revertedWith("Auction__AlreadySold");
        });
    });

    describe("Emergency Functions", function () {

        it("Should allow emergency withdrawal by admin", async function () {
            // First add some funds to contract
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            const itemId = receipt.events.find(e => e.event === 'ItemSubmitted').args.itemId;
            
            await auction.connect(owner).verifyItem(itemId);
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });

            // Perform emergency withdrawal
            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            const withdrawTx = await auction.connect(owner).emergencyWithdraw();
            const withdrawReceipt = await withdrawTx.wait();
            const gasUsed = withdrawReceipt.gasUsed.mul(withdrawReceipt.effectiveGasPrice);

            const finalBalance = await ethers.provider.getBalance(owner.address);
            
            // Should receive the bid amount
            expect(finalBalance.sub(initialBalance).add(gasUsed))
                .to.equal(ethers.utils.parseEther("0.2"));
        });

        it("Should prevent non-admin emergency withdrawal", async function () {
            await expect(auction.connect(addr1).emergencyWithdraw())
                .to.be.revertedWith("Auction__NotAdmin");
        });

        it("Should prevent emergency withdrawal with no balance", async function () {
            await expect(auction.connect(owner).emergencyWithdraw())
                .to.be.revertedWith("Auction__NoFundsToWithdraw");
        });
    });

    describe("View Functions", function () {
        let itemId;

        beforeEach(async function () {
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            itemId = receipt.events.find(e => e.event === 'ItemSubmitted').args.itemId;
            
            await auction.connect(owner).verifyItem(itemId);
        });

        it("Should return correct minimum valid bid", async function () {
            // Initial minimum bid should be starting price
            let minBid = await auction.getMinimumValidBid(itemId);
            expect(minBid).to.equal(ethers.utils.parseEther("0.1"));

            // Place a bid
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });

            // New minimum bid should be current bid plus increment
            minBid = await auction.getMinimumValidBid(itemId);
            expect(minBid).to.equal(ethers.utils.parseEther("0.21"));
        });

        it("Should return correct auction status", async function () {
            const status = await auction.getAuctionStatus();
            expect(status.isActive).to.be.true;
            expect(status.endTime).to.be.gt(status.currentTime);
        });

        it("Should return correct bidder balance", async function () {
            // Place initial bid
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });

            // Outbid the first bidder
            await auction.connect(addrs[0]).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.3") 
            });

            // Check balance of outbid bidder
            const balance = await auction.getBidderBalance(addr2.address);
            expect(balance).to.equal(ethers.utils.parseEther("0.2"));
        });

        it("Should return all item IDs", async function () {
            // Submit another item
            const tx = await auction.connect(addr1).submitItem(
                "Second Item",
                "Another Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );

            const itemIds = await auction.getAllItemIds();
            expect(itemIds.length).to.equal(2);
            expect(itemIds[0]).to.equal(itemId);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle concurrent bids properly", async function () {
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            const itemId = receipt.events.find(e => e.event === 'ItemSubmitted').args.itemId;
            
            await auction.connect(owner).verifyItem(itemId);
        
            // Place bids sequentially with proper bid increments
            await auction.connect(addr2).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.2") 
            });
            
            await auction.connect(addrs[0]).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.22") // Previous bid + minimum increment (0.01)
            });
            
            await auction.connect(addrs[1]).placeBid(itemId, { 
                value: ethers.utils.parseEther("0.24") // Previous bid + minimum increment (0.01)
            });
        
            // Verify final state
            const item = await auction.s_auctionItems(itemId);
            expect(item.highestBid).to.equal(ethers.utils.parseEther("0.24"));
            expect(item.highestBidder).to.equal(addrs[1].address);
            expect(item.bidCount).to.equal(3);
        
            // Verify previous bidders can withdraw their funds
            const addr2Balance = await auction.getBidderBalance(addr2.address);
            const addrs0Balance = await auction.getBidderBalance(addrs[0].address);
            
            expect(addr2Balance).to.equal(ethers.utils.parseEther("0.2"));
            expect(addrs0Balance).to.equal(ethers.utils.parseEther("0.22"));
        });

        it("Should handle auction end with no bids", async function () {
            await auction.connect(owner).startAuction(60);
            
            const tx = await auction.connect(addr1).submitItem(
                "Test Item",
                "Description",
                ethers.utils.parseEther("0.1"),
                { value: ITEM_SUBMISSION_FEE }
            );
            const receipt = await tx.wait();
            const itemId = receipt.events.find(e => e.event === 'ItemSubmitted').args.itemId;
            
            await auction.connect(owner).verifyItem(itemId);

            await time.increase(3600);
            
            await expect(auction.connect(owner).endAuction(itemId))
                .to.emit(auction, "AuctionEnded")
                .withArgs(itemId, ethers.constants.AddressZero, 0);
        });
    });
});