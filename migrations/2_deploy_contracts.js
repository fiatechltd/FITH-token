var FITHToken = artifacts.require("./FITHToken.sol");
//var DappTokenSale = artifacts.require("./DappTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(FITHToken).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    //return deployer.deploy(DappTokenSale, DappToken.address, tokenPrice);
  });
};
