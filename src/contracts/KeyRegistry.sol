pragma solidity ^0.4.4;


contract KeyRegistry {

  struct Certificate {
      address creator;
      bytes32 emailAddress;
			bytes32 pgpKey;
			address[] validators;
			uint256[] requestedValidations;
			//uint256 creationBlock;
  }

  Certificate[] public certificates;

	mapping (bytes32 => uint256) addressIndex;
	mapping (address => uint256) creatorIndex;

  event RequestValidation(bytes32 indexed requester, address indexed validator);


  function join(bytes32 _emailAddress, bytes32 _pgpKey) public {
			require(addressIndex[_emailAddress] == 0);

			uint256 i;
			uint256[] storage indecies;
			// create list of random validators
			if(certificates.length < 30){
				for(i=0;i<certificates.length-1;i++){
					indecies.push(i);
				}
			}else{
				for(i=0;i<30;i++){
					indecies.push(uint256(keccak256(uint256(_emailAddress)+i))%certificates.length);
				}
			}


		  uint256 index = certificates.length++;
      Certificate storage certificate = certificates[index];

			certificate.emailAddress = _emailAddress;
			certificate.creator = msg.sender;
			certificate.pgpKey = _pgpKey;
			//certificate.creationBlock = getBlockNumber();
			addressIndex[_emailAddress] = index;
			creatorIndex[msg.sender] = index;



			for(i=0;i<indecies.length;i++){
				certificates[indecies[i]].requestedValidations.push(i);
				certificate.validators.push(certificates[indecies[i]].creator);
				emit RequestValidation(_emailAddress, certificates[indecies[i]].creator);
			}
  }

	function validate(uint256 requester) public {
		address[] storage validatorList = certificates[requester].validators;
		uint256[] storage requestedValidationsList = certificates[creatorIndex[msg.sender]].requestedValidations;
		for(uint i = 0; i < validatorList.length;i++){
			if(validatorList[i]==msg.sender){
				validatorList[i] = validatorList[validatorList.length];
				validatorList[validatorList.length] = address(0);
			}
		}
		for(i = 0; i < requestedValidationsList.length;i++){
			if(requestedValidationsList[i]==requester){
				requestedValidationsList[i] = requestedValidationsList[requestedValidationsList.length];
				requestedValidationsList[requestedValidationsList.length] = 0;
			}
		}
	}

	function getKey(bytes32 requester) public view returns (bytes32) {
		return certificates[addressIndex[requester]].pgpKey;
	}

}
