const { network } = require("hardhat")
const { verify } = require("../utils/verify")
const developmentChains = ["hardhat", "localhost"]

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const auction = await deploy("Auction", {
        from: deployer,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(auction.address, [])
    }
    log(
        "--------------------------------------------------------------------------"
    )
}
module.exports.tags = ["all", "auction"]
