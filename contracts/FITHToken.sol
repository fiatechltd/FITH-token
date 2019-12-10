pragma solidity ^0.5.0;

//import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import "./lifecycle/Pausable.sol";
import "./ERC20Interface.sol";
import "./Owned.sol";
import "./SafeMath.sol";

// ----------------------------------------------------------------------------
// 'FITH Fiatech Token' contract
//
// Symbol      : FITH
// Name        : FITH Fiatech Token
// Total supply: 10,000,000,000.0000
// Decimals    : 4
//

// ----------------------------------------------------------------------------
// ERC20 Token, with the addition of symbol, name and decimals and an
// initial fixed supply
// ----------------------------------------------------------------------------

contract FITHToken is ERC20Interface, Owned, Pausable {

    using SafeMath for uint;


    string public symbol;
    string public name;
	string public standard;

    uint8 public decimals;

    uint public _totalSupply;



	bool locked = false;

    mapping(address => uint) balances;

	mapping(address => mapping(address => uint)) allowed;


    // ------------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------------
    constructor() public onlyOwner {

        symbol = "FITH";
        name = "FITH Token";
		standard = "FITH Token v1.0";

        decimals = 4;

        _totalSupply = 10000000000 * 10**uint(decimals);
		
        if(locked) revert();
        locked = true;
		
        balances[owner] = _totalSupply;
        emit Transfer(address(0), owner, _totalSupply);
    }

	

    // ------------------------------------------------------------------------
    // Total supply
    // ------------------------------------------------------------------------
	function totalSupply() public view returns (uint) {
        return _totalSupply  - balances[address(0)];
    }



    // ------------------------------------------------------------------------
    // Get the token balance for account `tokenOwner`
    // ------------------------------------------------------------------------
    function balanceOf(address tokenOwner) public view returns (uint balance) {
        return balances[tokenOwner];
    }



    // ------------------------------------------------------------------------
    // Transfer the balance from token owner's account to `to` account
    // - Owner's account must have sufficient balance to transfer
    // - 0 value transfers are allowed
    // ------------------------------------------------------------------------
    function transfer(address to, uint tokens) public whenNotPaused returns (bool success) {
		require(to != address(0));
		require(balances[msg.sender] >= tokens);
		
		balances[msg.sender] = balances[msg.sender].sub(tokens);
        balances[to] = balances[to].add(tokens);
		
		emit Transfer(msg.sender, to, tokens);

        return true;
    }



    // ------------------------------------------------------------------------
    // Token owner can approve for `spender` to transferFrom(...) `tokens`
    // from the token owner's account
    //
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md
    // recommends that there are no checks for the approval double-spend attack
    // as this should be implemented in user interfaces
    // ------------------------------------------------------------------------
    function approve(address spender, uint tokens) public whenNotPaused returns (bool success) {

        allowed[msg.sender][spender] = tokens;

        emit Approval(msg.sender, spender, tokens);

        return true;
    }



    // ------------------------------------------------------------------------
    // Transfer `tokens` from the `from` account to the `to` account
    //
    // The calling account must already have sufficient tokens approve(...)-d
    // for spending from the `from` account and
    // - From account must have sufficient balance to transfer
    // - Spender must have sufficient allowance to transfer
    // - 0 value transfers are allowed
	///*** The user executing the function pays the transfer fees, not the funds owner
    // ------------------------------------------------------------------------
    function transferFrom(address from, address to, uint tokens) public whenNotPaused returns (bool success) {
		require(tokens <= balances[from]);
        require(tokens <= allowed[from][msg.sender]);
		
		balances[from] = balances[from].sub(tokens);

        allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);

        balances[to] = balances[to].add(tokens);
		
		emit Transfer(from, to, tokens);

        return true;
    }



    // ------------------------------------------------------------------------
    // Returns the amount of tokens approved by the owner that can be
    // transferred to the spender's account
    // ------------------------------------------------------------------------
    function allowance(address tokenOwner, address spender) public view returns (uint remaining) {
        return allowed[tokenOwner][spender];
    }


	
    // ------------------------------------------------------------------------
    // Don't accept ETH
    // ------------------------------------------------------------------------
    function () external payable {
        revert();
    }



    // ------------------------------------------------------------------------
    // Owner can recover any accidentally sent ERC20 tokens back to user address
    // ------------------------------------------------------------------------
    function recoverAnyERC20Token(address tokenAddress, address loser, uint tokens) public onlyOwner returns (bool success) {
        return ERC20Interface(tokenAddress).transfer(loser, tokens);
    }

}