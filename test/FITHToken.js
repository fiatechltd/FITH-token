var FITHToken = artifacts.require("./FITHToken.sol");

contract('FITHToken', function(accounts) {
  var tokenInstance;
  let contractOwner = accounts[0];

  it('initializes the contract with the correct values', function() {
    return FITHToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.name();
    }).then(function(name) {
      assert.equal(name, 'FITH Token', 'has the correct name');
      return tokenInstance.symbol();
    }).then(function(symbol) {
      assert.equal(symbol, 'FITH', 'has the correct symbol');
      return tokenInstance.standard();
    }).then(function(standard) {
      assert.equal(standard, 'FITH Token v1.0', 'has the correct standard');
    });
  })

  it('allocates the initial supply upon deployment', function() {
    return FITHToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.totalSupply();
    }).then(function(totalSupply) {
      assert.equal(totalSupply.toNumber(), 100000000000000, 'sets the total supply to 10,000,000,000.0000');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(adminBalance) {
      assert.equal(adminBalance.toNumber(), 100000000000000, 'it allocates the initial supply to the admin account');
    });
  });

  it('transfers token ownership', function() {
    return FITHToken.deployed().then(function(instance) {
      tokenInstance = instance;
      // Test `require` statement first by transferring something larger than the sender's balance
      return tokenInstance.transfer.call(accounts[1], 999999999999999);
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
      return tokenInstance.transfer.call(accounts[1], 250000, { from: accounts[0] });
    }).then(function(success) {
      assert.equal(success, true, 'it returns true');
      return tokenInstance.transfer(accounts[1], 250000, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      assert.equal(receipt.logs[0].args.from, accounts[0], 'logs the account the tokens are transferred from');
      assert.equal(receipt.logs[0].args.to, accounts[1], 'logs the account the tokens are transferred to');
      assert.equal(receipt.logs[0].args.tokens, 250000, 'logs the transfer amount');
      return tokenInstance.balanceOf(accounts[1]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
      return tokenInstance.balanceOf(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 99999999750000, 'deducts the amount from the sending account');
    });
  });

  it('transfers contract ownership', function() {
    return FITHToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.owner();
	}).then(function(ownerAddress) {
	  assert.equal(ownerAddress, accounts[0], 'checks the contract owner address is the 1st address');
	  // Test not owner user trying to transfer ownership of contract
      return tokenInstance.transferOwnership(accounts[1], { from: accounts[2] });
	}).then(assert.fail).catch(function(error) {
	  assert(error.message.indexOf('revert') >= 0, 'only owner can transfer contract ownership');
	  return tokenInstance.transferOwnership(accounts[1], { from: contractOwner });
	}).then(function(receipt) {
	  return tokenInstance.newOwner();
	}).then(function(newOwnerAddress) {
		assert.equal(newOwnerAddress, accounts[1], `contract ownership transfer requested for new owner to be ${accounts[1]}`);
		// Test wrong user trying to accept contract transfer ownership
		return tokenInstance.acceptOwnership({ from: accounts[2] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
	  return tokenInstance.acceptOwnership({ from: accounts[1] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'OwnershipTransferred', 'should be the "OwnershipTransferred" event');
      assert.equal(receipt.logs[0].args._from, accounts[0], 'logs the old contract owner account');
      assert.equal(receipt.logs[0].args._to, accounts[1], 'logs the new contract owner account');
      return tokenInstance.owner();
	}).then(function(owner) {
      assert.equal(owner, accounts[1], `contract owner should be: ${accounts[1]}`);
	  return tokenInstance.newOwner();
	}).then(function(newOwner) {
      assert.equal(newOwner, 0, 'contract new owner should be: 0}');
    });
  });
  
  it('approves tokens for delegated transfer', function() {
    return FITHToken.deployed().then(function(instance) {
      tokenInstance = instance;
      return tokenInstance.approve.call(accounts[1], 100);
    }).then(function(success) {
      assert.equal(success, true, 'it returns true');
      return tokenInstance.approve(accounts[1], 100, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
      assert.equal(receipt.logs[0].args.tokenOwner, accounts[0], 'logs the account the tokens are authorized by');
      assert.equal(receipt.logs[0].args.spender, accounts[1], 'logs the account the tokens are authorized to');
      assert.equal(receipt.logs[0].args.tokens, 100, 'logs the transfer amount');
      return tokenInstance.allowance(accounts[0], accounts[1]);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated transfer');
    });
  });

  it('handles delegated token transfers', function() {
    return FITHToken.deployed().then(function(instance) {
      tokenInstance = instance;
      fromAccount = accounts[2];
      toAccount = accounts[3];
      spendingAccount = accounts[4];
      // Transfer some tokens to fromAccount
      return tokenInstance.transfer(fromAccount, 100, { from: accounts[0] });
    }).then(function(receipt) {
      // Approve spendingAccount to spend 10 tokens form fromAccount
      return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
    }).then(function(receipt) {
      // Try transferring something larger than the sender's balance
      return tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
      // Try transferring something larger than the approved amount
      return tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
      return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount });
    }).then(function(success) {
      assert.equal(success, true);
      return tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, 'triggers one event');
      assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
      assert.equal(receipt.logs[0].args.from, fromAccount, 'logs the account the tokens are transferred from');
      assert.equal(receipt.logs[0].args.to, toAccount, 'logs the account the tokens are transferred to');
      assert.equal(receipt.logs[0].args.tokens, 10, 'logs the transfer amount');
      return tokenInstance.balanceOf(fromAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 90, 'deducts the amount from the sending account');
      return tokenInstance.balanceOf(toAccount);
    }).then(function(balance) {
      assert.equal(balance.toNumber(), 10, 'adds the amount from the receiving account');
      return tokenInstance.allowance(fromAccount, spendingAccount);
    }).then(function(allowance) {
      assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance');
    });
  })
  
  it('test contract pause/unpause for emergency stop and resume situations', function() {
    return FITHToken.deployed().then(function(instance) {
		tokenInstance = instance;
		return tokenInstance.pause({ from: accounts[2] });
	}).then(assert.fail).catch(function(error) {
		assert(error.message.indexOf('revert') >= 0, `${accounts[2]} is not pauser admin to pause contract`);
		return tokenInstance.approve(accounts[1], 1000, { from: accounts[0] });
	}).then(function(receipt) {
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event');
		assert.equal(receipt.logs[0].args.tokenOwner, accounts[0], 'logs the user that approves someone else to transfer tokens on his/her behalf');
		assert.equal(receipt.logs[0].args.spender, accounts[1], 'logs the user that was approved to spend tokens');
		assert.equal(receipt.logs[0].args.tokens, 1000, 'logs the approved tokens to be spent');
		return tokenInstance.pause({ from: accounts[0] });
    }).then(function(receipt) {
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Paused', 'should be the "Paused" event');
		assert.equal(receipt.logs[0].args.account, accounts[0], 'logs the pauser admin account that paused the contract');
		return tokenInstance.unpause({ from: accounts[3] });
	}).then(assert.fail).catch(function(error) {
		console.log("error.message1: ", error.message);
		assert(error.message.indexOf('revert') >= 0, `${accounts[3]} is not pauser admin to unpause contract`);
		return tokenInstance.transfer(accounts[3], 1000, { from: accounts[1] });
	}).then(assert.fail).catch(function(error) {
		console.log("error.message2: ", error.message);
		assert(error.message.indexOf('revert') >= 0, 'transfer must fail, contract is paused');
		return tokenInstance.approve(accounts[1], 1000, { from: accounts[0] });
	}).then(assert.fail).catch(function(error) {
		console.log("error.message3: ", error.message);
		assert(error.message.indexOf('revert') >= 0, 'approve must fail, contract is paused');
		return tokenInstance.transferFrom(accounts[0], accounts[1], 500);
	}).then(assert.fail).catch(function(error) {
		console.log("error.message4: ", error.message);
		assert(error.message.indexOf('revert') >= 0, 'transferFrom must fail, contract is paused');
		return tokenInstance.unpause({ from: accounts[0] });
    }).then(function(receipt) {
		console.log("message5: ", receipt);
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Unpaused', 'should be the "Unpaused" event');
		assert.equal(receipt.logs[0].args.account, accounts[0], 'logs the pauser admin account that unpaused the contract');
		return tokenInstance.transferFrom.call(accounts[0], accounts[1], 500, { from: accounts[1] });
	}).then(function(success) {
		console.log("message6: ", success);
		assert.equal(success, true);
		return tokenInstance.transferFrom(accounts[0], accounts[1], 500, { from: accounts[1] });
	}).then(function(receipt) {
		console.log("message7: ", receipt);
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
		assert.equal(receipt.logs[0].args.from, accounts[0], 'logs the account the tokens are transferred from');
		assert.equal(receipt.logs[0].args.to, accounts[1], 'logs the account the tokens are transferred to');
		assert.equal(receipt.logs[0].args.tokens, 500, 'logs the transfer amount');
		return tokenInstance.transfer(accounts[3], 1000, { from: accounts[1] });
	}).then(function(receipt) {
		console.log("message8: ", receipt);
		assert.equal(receipt.logs.length, 1, 'triggers one event');
		assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event');
		assert.equal(receipt.logs[0].args.from, accounts[1], 'logs the account the tokens are transferred from');
		assert.equal(receipt.logs[0].args.to, accounts[3], 'logs the account the tokens are transferred to');
		assert.equal(receipt.logs[0].args.tokens, 1000, 'logs the transfer amount');
    });
  })
});
