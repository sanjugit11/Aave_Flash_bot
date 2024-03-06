const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
async function main() {

    // Sign = await hre.ethers.getContractFactory("Signature");
    // sign = await Sign.deploy("0xad8e276888084027244b4370Ac457e638758190B");
    // console.log("sign.target: ",sign.target);
    // sleep(5000)
    const ownersAddress = "0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF";
    const daiToken = "0xc8c0Cf9436F4862a8F60Ce680Ca5a9f0f99b5ded";
    const aaveToken = "0x1558c6FadDe1bEaf0f6628BDd1DFf3461185eA24";

     ////////   Token /////////
    WETH9 = await ethers.getContractFactory("contracts/tests/WETH9.sol:WETH9");
    // WETH = await WETH9.deploy();
    WETH = await WETH9.attach("0x1736e044Ad2c153B031BbB00fE74bA367a5EDdaa"); //0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd
    console.log("WETH: ",WETH.target);
    // sleep(5000)

    /// token///////////
    TokenA = await ethers.getContractFactory("TokenA");
    // TokenA = await TokenA.deploy();
    const newTokenA = await TokenA.attach(daiToken);
    const newTokenB = await TokenA.attach(aaveToken);
    console.log("tokenA: ",newTokenA.target);
    console.log("tokenB: ",newTokenB.target);
    //  const balanceofowner = await newTokenA.balanceOf("0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF")
    // console.log("tokenAbalance: ",balanceofowner);
    sleep(5000);

    // CalHash = await ethers.getContractFactory("CalHash");
    // const getInit = await CalHash.deploy();
    // console.log("inithash target", await getInit.target);
    // console.log("inithash", await getInit.getInitHash());
    //////uniswap//////
    ///////////// uniswapFactory ////////////////
    UniFactory = await ethers.getContractFactory("UniswapV2Factory");
    // uniFactory = await UniFactory.deploy(ownersAddress);
    uniFactory = await UniFactory.attach("0xE960166145F564F23617f005246a0a5e87458Bcd");
    console.log("uniFactory: ",uniFactory.target);
    sleep(5000)
    
    /////////uniswap router///////
    uniswapV2 = await ethers.getContractFactory("tuniSwap");
    // uniswap = await uniswapV2.deploy(uniFactory.target, WETH.target);
    uniswap = await uniswapV2.attach("0x37bE7C56fFE8f7F7A57977F363F1998f32802306");
    console.log("uniswap Router: ",uniswap.target);
    sleep(5000);

    ////////pancake//////////
    ////////////////pancakeFactory/////////////
    PancakeFactory = await ethers.getContractFactory("PancakeFactory");
    // cakeFactory = await PancakeFactory.deploy(ownersAddress);
    cakeFactory = await PancakeFactory.attach("0x30CB265B883514EDf5d1c4470F562573B492a20e");
    console.log("cakeFactory: ",cakeFactory.target);
    sleep(5000);

    ////pancake Router////////////
    PancakeSwap = await ethers.getContractFactory("PancakeSwap");
    // pSwap = await PancakeSwap.deploy(cakeFactory.target,WETH.target);
    pSwap = await PancakeSwap.attach("0xa2EcF593A376A6EFEc0252388dd62ff873C9BdA8");
    console.log("pancakeRouter ",pSwap.target);
    sleep(5000);

    //////uniswap
    await newTokenA.approve(uniswap.target,ethers.parseEther("1000000"));
    await newTokenB.approve(uniswap.target,ethers.parseEther("1000000"));
    // await uniswap.addLiquidityETH("0x81E581fE536759BCFC6074bb174AaDD494Ec4A9f", ethers.parseEther("500"), 1, 1,"0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF", 1879751580, { value: ethers.parseEther("0.5") ,gasLimit:5000000 });
    await uniswap.addLiquidity(newTokenA,newTokenB, ethers.parseEther("99"),ethers.parseEther("55"), 1, 1,"0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF", 1879751580, {gasLimit:5000000 });
    //////swap on uniswap
    // await newTokenA.approve(uniswap.target,ethers.parseEther("1000000"));
    // await uniswap.swapExactTokensForETH(ethers.parseEther("2"),1,[newTokenA.target, WETH.target],"0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF",1879751580,{gasLimit:7000000});
    
    //pancakeuniswap
    // await newTokenA.approve(pSwap.target,ethers.parseEther("1000000"));
    // await pSwap.addLiquidityETH("0x81E581fE536759BCFC6074bb174AaDD494Ec4A9f", ethers.parseEther("55"), 1, 1,"0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF", 1879751580, { value: ethers.parseEther("1") });
    // await pSwap.addLiquidity("0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357","0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a", ethers.parseEther("111"),ethers.parseEther("111"), 1, 1,"0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF", 1879751580, {gasLimit:5000000 });
    
    //  await pSwap.swapExactTokensForETH(ethers.parseEther("40"),1,[newTokenA.target, WETH.target],"0xb4fAD36BD8BDFA0321040ADb48A5ED7307Fb5BaF",1879751580,{gasLimit:6000000}).then((tx)=>{
    //   console.log("----------swap done-------------");
    //  });

    // Token2 = await ethers.getContractFactory("MyToken2");
    // token2 = await Token2.deploy("0xad8e276888084027244b4370Ac457e638758190B");
    // console.log("token: ",token2.address);
    // sleep(5000)

    // FlashBot =  await ethers.getContractFactory("FlashBot");
    // flashBot =  await FlashBot.deploy(WETH.target);
    // // flashBot =  await FlashBot.attach("0xa1c758F0Fc7005e722f3Dd861E81231C55157C10");
    // console.log("flashBot: ",flashBot.target);
    // sleep(5000)  

    // await proxy.upgradeTo(card.address);
        
    // card = card.attach(proxy.address);
        
    // await card.initialize("0xad8e276888084027244b4370Ac457e638758190B","0x56253fE5BEc53a71989f968CfC48cd27736244a1",1000000,1000000,1000000);

}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
