// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import './PancakePair.sol';

contract CalHashB {
    function getInitHash() public pure returns(bytes32){
        bytes memory bytecode = type(PancakePair).creationCode;
        return keccak256(abi.encodePacked(bytecode));
    }
}
