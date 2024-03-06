// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "../PancakeFactory.sol";

contract factoryB is PancakeFactory{

    constructor() PancakeFactory(msg.sender){

    }

}