var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = require("../mnemonic")

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/bzlFsjlUzxFFkRX1pmxX")
      },
      network_id: 4
    }
  }
}
