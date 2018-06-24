<script src="PATH/web3.min.js"></script>

<script type="text/javascript">
//define web3
if(typeof window.web3 !== "undefined" && typeof window.web3.currentProvider !== "undefined") {
  const web3 = new Web3(window.web3.currentProvider);
}
else {
  const web3 = new Web3();
}

//make contract copy
const address = '0x8bf5986f5a2388ac9617f10333c8720c11760c32';
//const abi = ''
const contract = new web3.eth.Contract(abi, address);

//functions of contracts
async getkey (email) {
  const pubkey = await contract.methods.getKey(email).call();
};

async cert () {
  const response = await contract.methods.certificates().call();
};
</script>
