const { ethers, run } = require("hardhat");

async function verifyContracts() {
  // const signatureAddress = "0x3418f0e03045A4B3677204aAe648f180464Fd91B";
//   const args = ["0xad8e276888084027244b4370Ac457e638758190B"];
  const args1 = ["0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"];
//   const args2 = ["0xad8e276888084027244b4370Ac457e638758190B"];
const UniswapFactoryAddress = "0xE960166145F564F23617f005246a0a5e87458Bcd"; 
const PancakeAddressFactory = "0x4afc21212317b2f51ff72CEFcE0024C6Ea233a8D"; 
const uniswapAddress = "0x37be7c56ffe8f7f7a57977f363f1998f32802306"; 
const PancakeSwap = "0x1BF98A8c4D5856f4F1DB44C84dD7ac7D93294793"; 
const owner = "0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF";
const WETH9 = "0x1736e044Ad2c153B031BbB00fE74bA367a5EDdaa";

const argsPan = ["0x4afc21212317b2f51ff72CEFcE0024C6Ea233a8D","0x3279C8B014fB4a7FB0d35B9D88A46f90C0c7CF9B"];
const argsUni = ["0xE960166145F564F23617f005246a0a5e87458Bcd","0x1736e044Ad2c153B031BbB00fE74bA367a5EDdaa"];


    // await run("verify:verify", {
    //     address: WethAddress,
    //     // constructorArguments: args2,
    //     contract: "contracts/tests/WETH9.sol:WETH9"
    //   });

  // await run("verify:verify", {
  //   address: PancakeAddressFactory,
  //   constructorArguments: [owner],
  //   contract: "contracts/PancakeFactory.sol:PancakeFactory"
  // });

  // await run("verify:verify", {
  //   address: PancakeSwap,
  //   constructorArguments: argsPan,
  //   contract: "contracts/PancakeSwap.sol:PancakeSwap"
  // });

  /////uniswap/////////////
  // await run("verify:verify", {
  //   address: UniswapFactoryAddress,
  //   constructorArguments: [owner],
  //   contract: "contracts/UniswapV2Factory.sol:UniswapV2Factory"
  // });

  await run("verify:verify", {
    address: uniswapAddress,
    constructorArguments: argsUni,
    contract: "contracts/UniswapV2Router02.sol:tuniSwap"
  });

  // await run("verify:verify", {
  //   address: flashBotAddress,
  //   constructorArguments: args1,
  //   contract: "contracts/FlashBot.sol:FlashBot"
  // });

  // await run("verify:verify", {
  //   address: WrappedAddress,
  // });
}

verifyContracts();