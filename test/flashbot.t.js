const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { Contract } = require('@ethersproject/contracts');
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

// const { ethers } = require("hardhat")
// const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/signers');
// const { expect } = require('chai');
// const { SignerWithAddress } = require("@nomiclabs/hardhat-ethers/signers");

describe("Uniswap", function () {
    let tokenA, FlashBot, flashBot, WETH9B, WETHB, signer, PancakeFactory, PancakePair,
        pancakePair, PancakeSwap, pSwap, cakeFactory, FactoryA, factoryA, factoryB, FactoryB,
        txToken, UniswapV2Pair, uniswapPair, lpTokens, tokenB, uniswap, owner, add1, add2,
        uniswapV2, getInit, GetInit, ercTokenA, ercTokenB, WETH9, factory, Factory, WETH, UniFactory,
        uniFactory;
    beforeEach(async function () {

        [ owner,add1,add2 ]= await ethers.getSigners();
        ercTokenA = await ethers.getContractFactory("TokenA");
        tokenA = await ercTokenA.connect(owner).deploy();
        // console.log("1");

        GetInit = await ethers.getContractFactory("CalHash");
        getInit = await GetInit.deploy();
        console.log("inithash", await getInit.getInitHash());

        ercTokenB = await ethers.getContractFactory("TokenB");
        tokenB = await ercTokenB.connect(owner).deploy();
        // console.log("2");

        taxToken = await ethers.getContractFactory("tax_token");
        txToken = await taxToken.deploy();

        UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair");
        uniswapPair = await UniswapV2Pair.deploy();

        PancakePair = await ethers.getContractFactory("PancakePair");
        PancakePair = await PancakePair.deploy();

        WETH9 = await ethers.getContractFactory("WETH9");
        WETH = await WETH9.deploy();
        console.log("3");

        WETH9B = await ethers.getContractFactory("WETH9B");
        WETHB = await WETH9.deploy();

        UniFactory = await ethers.getContractFactory("UniswapV2Factory");
        const ownersAddress = owner.address;
        uniFactory = await UniFactory.connect(owner).deploy(ownersAddress);
        console.log("4");

        PancakeFactory = await ethers.getContractFactory("PancakeFactory");
        cakeFactory = await PancakeFactory.connect(owner).deploy(ownersAddress);

        // Factory = await ethers.getContractFactory("factory");
        // factory = await Factory.deploy();

        FactoryA = await ethers.getContractFactory("factoryA");
        factoryA = await FactoryA.deploy();

        FactoryB = await ethers.getContractFactory("factoryB");
        factoryB = await FactoryB.deploy();
        console.log("5");

        uniswapV2 = await ethers.getContractFactory("tuniSwap");
        // console.log("factoryA.address",factoryA.target);
        // console.log("factoryA.address",WETH.target)
        uniswap = await uniswapV2.deploy(factoryA.target, WETH.target);

        PancakeSwap = await ethers.getContractFactory("PancakeSwap");
        // console.log("factoryA.address",factoryA.target);
        // console.log("factoryA.address",WETH.target)
        pSwap = await PancakeSwap.deploy(factoryB.target, WETH.target);
        console.log("6");

        uniLibrary = await ethers.getContractFactory("UniswapV2Library");
        library = await uniLibrary.deploy();

        FlashBot = await ethers.getContractFactory("FlashBot");
        flashBot = await FlashBot.deploy(WETH.target);
        console.log("7");
        //aave flashbot
        // FlashBot = await ethers.getContractFactory("SimpleFlashLoan");
        // flashBot = await FlashBot.deploy(WETH.target);
        // console.log("7");


    })
    describe("Add Liquidity", function () {

        beforeEach(async function () {
            // await WETH.connect(owner).mint(owner.address, 10000000);
            const amountEth = ethers.parseEther('1000');
            // console.log("8");
            await WETH.deposit({ value: amountEth });
            // console.log("9");
            await WETH.connect(owner).approve(uniswap.target, 10000000);
            // console.log("10");
            await WETH.connect(owner).approve(pSwap.target, 10000000);
            // console.log("11");
            const tokenAllowanceWETH = await WETH.allowance(owner.address, uniswap.target);
            // console.log("12");
            console.log("allowanceA:", await tokenAllowanceWETH);
            console.log("WETH.target:", WETH.target)

            await tokenA.connect(owner).mint(owner.address, ethers.parseEther("10000000000000000000"));
            await tokenA.connect(owner).approve(uniswap.target, ethers.parseEther("10000000000000000000"));
            await tokenA.connect(owner).approve(pSwap.target, ethers.parseEther("10000000000000000000"));
            const tokenAllowanceA = await tokenA.allowance(owner.address, uniswap.target);
            console.log("allowanceA:", await tokenAllowanceA)
            console.log("tokenA.target:", tokenA.target)

            // expect(tokenAllowanceA).to.equal(1000000);
            await tokenB.connect(owner).mint(owner.address, ethers.parseEther("10000000000000000000"));
            await tokenB.connect(owner).approve(uniswap.target, ethers.parseEther("100000000000000000"));
            await tokenB.connect(owner).approve(pSwap.target, ethers.parseEther("1000000000000000000"));
            const tokenAllowanceB = await tokenB.allowance(owner.address, uniswap.target);
            console.log("allowanceB:", await tokenAllowanceB)
            console.log("tokenB.target:", tokenB.target)
        })

        describe("testing flashBot contract", function () {
            it.only("Should do flash swap between Pancake and UniswapV2", async function () {
                //uniswap add liquidity
                await uniswap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("627.226"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("0.564") });
                // await uniswap.connect(owner).addLiquidity(tokenA.target,tokenB.target, ethers.parseEther("1"),ethers.parseEther("100"), 1, 1, owner.address, 1879751580);
                //pair get
                const TokenPairA = await factoryA.getPair(WETH.target, tokenB.target);
                // const TokenPairA = await factoryA.getPair(tokenA.target, tokenB.target);
                console.log("tokenPairA:", TokenPairA);
                const unipair =await uniswapPair.attach(TokenPairA);
                //reserve check
                const uniReserve = await unipair.getReserves();
                console.log("uniReserve:--", "/n", uniReserve);
                ////////////////////////
                //pancake add liquidity
                await pSwap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("500"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("0.5") });
                // .await pSwap.connect(owner).addLiquidity(tokenA.target,tokenB.target, ethers.parseEther("1"),ethers.parseEther("200"), 1, 1, owner.address, 1879751580);
                //cake pair get
                const TokenPairB = await factoryB.getPair(WETH.target, tokenB.target);
                // const TokenPairB = await factoryB.getPair(tokenA.target, tokenB.target);
                console.log("tokenPairB:", TokenPairB);
                const cakepair =await PancakePair.attach(TokenPairB);
                //reserve check
                const cakeReserve = await cakepair.getReserves();
                console.log("cakeReserve:--", "/n", cakeReserve);

                const balanceBefore = await ethers.provider.getBalance(flashBot.target);
                console.log("balanceBefore:", balanceBefore);

                // const a = await flashBot.getProfit(TokenPairB, TokenPairA);
                const a = await flashBot.getProfit(TokenPairA, TokenPairB);
                console.log("getProfit------------->: ", a);
                await flashBot.flashArbitrage(TokenPairA, TokenPairB);

                const balanceAfter = await ethers.provider.getBalance(flashBot.target);
                console.log("balanceAfter:", balanceAfter);

                // const uniReserveAfter = await unipair.getReserves();
                // console.log("uniReserveAfter:--", "/n", uniReserveAfter);

                // const cakeReserveAfter = await cakepair.getReserves();
                // console.log("cakeReserveAfter:--", "/n", cakeReserveAfter);

                //////////////////////////2//////////////////////////////////////////
                // console.log("/n");
                // console.log("/n");
                // function sleep(ms) {
                //     return new Promise((resolve) => setTimeout(resolve, ms));
                //   }
                //   await sleep(2000);

                // console.log("/////////////////////////////////////2///////////////////////////////");
  
  
 
 
                ////////////////////////////////////////////////////////////////////////////////           
                ////swap in uinswap pool 
                // await tokenB.connect(owner).mint(add1.address, ethers.parseEther("777"));
                // console.log("addr1 mint amount",await tokenB.balanceOf(add1.address))
                // await tokenB.connect(add1).approve(uniswap.target, ethers.parseEther("777"));
                // console.log("saaaaaaaaaaaaaaaaa",tokenB.target,WETH.target)
                // // await uniswap.connect(add1).swapExactETHForTokens(1,[WETH.target,tokenA.target],add1.address,1879751580,{ value: ethers.parseEther("16") });
                // await uniswap.connect(add1).swapExactTokensForETH(ethers.parseEther("3"),1,[tokenB.target, WETH.target],add1.address,1879751580);
                // //uniswap add liquidity
                // // await uniswap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("700"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("60") });
                // //pair get
                // const TokenPairAA = await factoryA.getPair(WETH.target, tokenB.target);
                // console.log("tokenPairA:", TokenPairAA);
                // const unipairAA =await uniswapPair.attach(TokenPairAA);
                // //reserve check
                // const uniReserveAA = await unipairAA.getReserves();
                // console.log("uniReserveAA:--", "/n", uniReserveAA);
                // ////////////////////////

                ///// Abritrage 2 /////////////////////////////////
                // const aa = await flashBot.getProfit(TokenPairA, TokenPairB);
                // console.log("getProfit------------->: ", aa);
                // await flashBot.flashArbitrage(TokenPairA, TokenPairB);
                // const balanceAfterBB = await ethers.provider.getBalance(flashBot.target);
                // console.log("balanceAfterBB:", balanceAfterBB);

                // const uniReserveAfter2 = await unipair.getReserves();
                // console.log("uniReserveAfter2:--", "/n", uniReserveAfter2);

                // const cakeReserveAfter2 = await cakepair.getReserves();
                // console.log("cakeReserveAfter2:--", "/n", cakeReserveAfter2);

 ////////////////////////////////////////////////////////////////////               
            })
            describe("testing flashBot contract 10/1000 && 10/2000 ", function () {
                it("Should do flash swap between Pancake and UniswapV2", async function () {
                    //uniswap add liquidity
                    // await uniswap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("1000"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("10") });
                await uniswap.connect(owner).addLiquidity(tokenA.target,tokenB.target, ethers.parseEther("10"),ethers.parseEther("1000"), 1, 1, owner.address, 1879751580);
                    //pair get
                    const TokenPairA = await factoryA.getPair(tokenA.target, tokenB.target);
                    console.log("tokenPairA:", TokenPairA);
                    const unipair =await uniswapPair.attach(TokenPairA);
                    //reserve check
                    const uniReserve = await unipair.getReserves();
                    console.log("uniReserve:--", "/n", uniReserve);
                    ////////////////////////
                    //pancake add liquidity
                    // await pSwap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("2000"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("10") });
                    await pSwap.connect(owner).addLiquidity(tokenA.target,tokenB.target, ethers.parseEther("10"),ethers.parseEther("2000"), 1, 1, owner.address, 1879751580);
                    //cake pair get
                    const TokenPairB = await factoryB.getPair(tokenA.target, tokenB.target);
                    console.log("tokenPairB:", TokenPairB);
                    const cakepair =await PancakePair.attach(TokenPairB);
                    //reserve check
                    const cakeReserve = await cakepair.getReserves();
                    console.log("cakeReserve:--", "/n", cakeReserve);
    
                    const balanceBefore = await ethers.provider.getBalance(flashBot.target);
                    console.log("balanceBefore:", balanceBefore);
    
                    // const a = await flashBot.getProfit(TokenPairB, TokenPairA);
                    const a = await flashBot.getProfit(TokenPairA, TokenPairB);
                    console.log("getProfit------------->: ", a);
                    await flashBot.flashArbitrage(TokenPairA, TokenPairB);
                    const balanceAfter = await ethers.provider.getBalance(flashBot.target);
                    console.log("balanceAfter:", balanceAfter);
    
                    const uniReserveAfter = await unipair.getReserves();
                    console.log("uniReserveAfter:--", "/n", uniReserveAfter);
    
                    const cakeReserveAfter = await cakepair.getReserves();
                    console.log("cakeReserveAfter:--", "/n", cakeReserveAfter);
               })
           })

    //        describe("testing flashBot contract 100 /10000 && 1000/200000 ", function () {
    //         it("Should do flash swap between Pancake and UniswapV2", async function () {
    //             //uniswap add liquidity
    //             // await uniswap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("10000"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("100") });
    //             await uniswap.connect(owner).addLiquidity(tokenA.target,tokenB.target, ethers.parseEther("100"),ethers.parseEther("20000"), 1, 1, owner.address, 1879751580);
    //             //pair get
    //             const TokenPairA = await factoryA.getPair(tokenA.target, tokenB.target);
    //             console.log("tokenPairA:", TokenPairA);
    //             const unipair =await uniswapPair.attach(TokenPairA);
    //             //reserve check
    //             const uniReserve = await unipair.getReserves();
    //             console.log("uniReserve:--", "/n", uniReserve);
    //             ////////////////////////
    //             //pancake add liquidity
    //             // await pSwap.connect(owner).addLiquidityETH(tokenB.target, ethers.parseEther("20000"), 1, 1, owner.address, 1879751580, { value: ethers.parseEther("1000") });
    //             await pSwap.connect(owner).addLiquidity(tokenA.target,tokenB.target, ethers.parseEther("10000"),ethers.parseEther("2000000"), 1, 1, owner.address, 1879751580);
    //             //cake pair get
    //             const TokenPairB = await factoryB.getPair(tokenA.target, tokenB.target);
    //             console.log("tokenPairB:", TokenPairB);
    //             const cakepair =await PancakePair.attach(TokenPairB);
    //             //reserve check
    //             const cakeReserve = await cakepair.getReserves();
    //             console.log("cakeReserve:--", "/n", cakeReserve);

    //             const balanceBefore = await ethers.provider.getBalance(flashBot.target);
    //             console.log("balanceBefore:", balanceBefore);

    //             // const a = await flashBot.getProfit(TokenPairB, TokenPairA);
    //             const a = await flashBot.getProfit(TokenPairA, TokenPairB);
    //             console.log("getProfit------------->: ", a);
    //             await flashBot.flashArbitrage(TokenPairA, TokenPairB);
    //             const balanceAfter = await ethers.provider.getBalance(flashBot.target);
    //             console.log("balanceAfter:", balanceAfter);

    //             const uniReserveAfter = await unipair.getReserves();
    //             console.log("uniReserveAfter:--", "/n", uniReserveAfter);

    //             const cakeReserveAfter = await cakepair.getReserves();
    //             console.log("cakeReserveAfter:--", "/n", cakeReserveAfter);
    //        })
    //    })
        })



















///ignore
        // it("Should add liquidity of taken A and token B", async function () {
        //     await uniswap.connect(owner).addLiquidityETH(tokenB.target, 50000, 1, 1, owner.address, 1879751580, { value: ethers.parseEther("10") });

        //     const TokenPair = await factoryA.getPair(WETH.target, tokenB.target);
        //     console.log("tokenPair:", TokenPair);
        // })
        // it("Should add 2nd liquidity of taken A and token B", async function () {
        //     await pSwap.connect(owner).addLiquidityETH(tokenB.target, 50000, 1, 1, owner.address, 1879751580, { value: ethers.parseEther("10") });

        //     const TokenPair = await factoryB.getPair(WETH.target, tokenB.target);
        //     console.log("tokenPair:", TokenPair);
        // })
    })
})