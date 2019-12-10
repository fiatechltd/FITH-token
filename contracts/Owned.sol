pragma solidity ^0.5.0;

// ----------------------------------------------------------------------------
// based on:
// https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol
// ----------------------------------------------------------------------------

contract Owned {

    address public owner;

    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    constructor() internal {
        owner = msg.sender;
		emit OwnershipTransferred(address(0), owner);
    }
	
    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    function acceptOwnership() public {
        require(msg.sender == newOwner);
		
        emit OwnershipTransferred(owner, newOwner);
        
		owner = newOwner;
        newOwner = address(0);
    }
}