var KeyRegistry = artifacts.require("./KeyRegistry.sol");

module.exports = function(deployer) {
  deployer.deploy(KeyRegistry);
};
