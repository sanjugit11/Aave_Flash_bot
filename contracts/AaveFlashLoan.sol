// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// import "./contractsAave/flashloan/base/FlashLoanSimpleReceiverBase.sol";
// import "./contractsAave/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
// import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IWETH.sol';
import './libraries/Decimal.sol';
import "hardhat/console.sol";


struct OrderedReserves {
    uint256 a1; // base asset
    uint256 b1;
    uint256 a2;
    uint256 b2;
}

struct ArbitrageInfo {
    address baseToken;
    address quoteToken;
    bool baseTokenSmaller;
    address lowerPool; // pool with lower price, denominated in quote asset
    address higherPool; // pool with higher price, denominated in quote asset
}

struct CallbackData {
    address debtPool;
    address targetPool;
    bool debtTokenSmaller;
    address borrowedToken;
    address debtToken;
    uint256 debtAmount;
    uint256 debtTokenOutAmount;
}

contract AaveFlashLoan3 is FlashLoanSimpleReceiverBase,Ownable{
    
   using Decimal for Decimal.D256;
    using SafeMath for uint256;
    // using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.AddressSet;
    
    // ACCESS CONTROL
    // Only the `permissionedPairAddress` may call the `uniswapV2Call` function
    address permissionedPairAddress = address(1);

    // WETH on ETH or WBNB on BSC
    address immutable WETH;
    // address public WETH;

    // AVAILABLE BASE TOKENS
    EnumerableSet.AddressSet baseTokens;

    //flashbot
    // AaveFlashLoan public aaveFlashLoan;

    event ArbitrageDataAddr(address BaseToken,address Pair1,address Pair2);
    event ArbitrageDataValue(uint256 BorrowedAmount,uint256 Profit);
    event Withdrawn(address indexed to, uint256 indexed value);
    event BaseTokenAdded(address indexed token);
    event BaseTokenRemoved(address indexed token);


    address constant ETHER = address(0);
    address  poolA = 0xae99444803aCf9AFe96665bC1E9dDf23221136b9; //uni
    address  poolB = 0x94Ea055BF547bc9D871B3b72c3Ffe74E8A6D7E3C; //pan
    address public _asset ;
    event LogWithdraw(
        address indexed _from,
        address indexed _assetAddress,
        uint amount
    );
    //  modifier onlyOwner() {
    //     require(msg.sender == owner, "only owner access");
    //     _;
    // }
    receive() external payable {}

    constructor(address _addressProvider , address _WETHBase)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
    {
               WETH = _WETHBase;
        baseTokens.add(_WETHBase);
    }

     //// aave flash loan exacute
    function fn_RequestFlashLoan(address _token, uint256 _amount) public onlyOwner{
        address receiverAddress = address(this);
         _asset = _token;
        uint256 amount = _amount;
        bytes memory params = "";
        uint16 referralCode = 0;

        POOL.flashLoanSimple(
            receiverAddress,
            _asset,
            amount,
            params,
            referralCode
        );
    }
    
    //This function is called after your contract has received the flash loaned amount

    function  executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    )  external override returns (bool) {
        
        //Logic goes here
        bool status = flashArbitrageAave(poolA,poolB,amount);

        uint256 totalAmount = amount + premium;
        IERC20(asset).approve(address(POOL), totalAmount);

        return status;
    }


    function addBaseToken(address token) external onlyOwner {
        baseTokens.add(token);
        emit BaseTokenAdded(token);
    }

    function removeBaseToken(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            // do not use safe transfer to prevents revert by any shitty token
            IERC20(token).transfer(owner(), balance);
        }
        baseTokens.remove(token);
        emit BaseTokenRemoved(token);
    }

    function getBaseTokens() external view returns (address[] memory tokens) {
        uint256 length = baseTokens.length();
        tokens = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = baseTokens.at(i);
        }
    }

    function baseTokensContains(address token) public view returns (bool) {
        console.log("baseTokensContains address",token);
        return baseTokens.contains(token);
    }

    function isbaseTokenSmaller(address pool0, address pool1)
        internal
        view
        returns (
            bool baseSmaller,
            address baseToken,
            address quoteToken
        )
    {
        require(pool0 != pool1, 'Same pair address');
        (address pool0Token0, address pool0Token1) = (IUniswapV2Pair(pool0).token0(), IUniswapV2Pair(pool0).token1());
        (address pool1Token0, address pool1Token1) = (IUniswapV2Pair(pool1).token0(), IUniswapV2Pair(pool1).token1());
        // console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz token ",pool0Token0 , pool0Token1);
        // console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz=> s",pool0Token0 < pool0Token1);
        // console.log("zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz==",pool1Token0 < pool1Token1);
        require(pool0Token0 < pool0Token1 && pool1Token0 < pool1Token1, 'Non standard uniswap AMM pair');
        require(pool0Token0 == pool1Token0 && pool0Token1 == pool1Token1, 'Require same token pair');
        require(baseTokensContains(pool0Token0) || baseTokensContains(pool0Token1), 'No base token in pair');
        (baseSmaller, baseToken, quoteToken) = baseTokensContains(pool0Token0) ? (true, pool0Token0, pool0Token1) : (false, pool0Token1, pool0Token0);
    }

    /// @dev Compare price denominated in quote token between two pools
    /// We borrow base token by using flash swap from lower price pool and sell them to higher price pool
    function getOrderedReserves(
        address pool0,
        address pool1,
        bool baseTokenSmaller
    )
        internal
        view
        returns (
            address lowerPool,
            address higherPool,
            OrderedReserves memory orderedReserves
        )
    {
        (uint256 pool0Reserve0, uint256 pool0Reserve1, ) = IUniswapV2Pair(pool0).getReserves(); //panckae reserve
        (uint256 pool1Reserve0, uint256 pool1Reserve1, ) = IUniswapV2Pair(pool1).getReserves();  //uniswap reserve
        // console.log("reserveeeeee uniswap===",pool0Reserve0,pool0Reserve1);
        // console.log("reserveeeeee pancake===",pool1Reserve0,pool1Reserve1);
        // console.log("reserveeeeee weth======",pool0Reserve1,pool1Reserve1);

        // Calculate the price denominated in quote asset token
        (Decimal.D256 memory price0, Decimal.D256 memory price1) =
            baseTokenSmaller
                ? (Decimal.from(pool0Reserve0).div(pool0Reserve1), Decimal.from(pool1Reserve0).div(pool1Reserve1))
                : (Decimal.from(pool0Reserve1).div(pool0Reserve0), Decimal.from(pool1Reserve1).div(pool1Reserve0));


        // get a1, b1, a2, b2 with following rule:
        // 1. (a1, b1) represents the pool with lower price, denominated in quote asset token
        // 2. (a1, a2) are the base tokens in two pools
        if (price0.lessThan(price1)) {
            console.log("here price0 is less then price1",price0.lessThan(price1));  //EG 0.4 < 0.5 //true
            (lowerPool, higherPool) = (pool0, pool1);  // unipair //cakepair
            (orderedReserves.a1, orderedReserves.b1, orderedReserves.a2, orderedReserves.b2) = baseTokenSmaller
                ? (pool0Reserve0, pool0Reserve1, pool1Reserve0, pool1Reserve1)
                : (pool0Reserve1, pool0Reserve0, pool1Reserve1, pool1Reserve0);
        } else {
            console.log("herein else");
            (lowerPool, higherPool) = (pool1, pool0);
            (orderedReserves.a1, orderedReserves.b1, orderedReserves.a2, orderedReserves.b2) = baseTokenSmaller
                ? (pool1Reserve0, pool1Reserve1, pool0Reserve0, pool0Reserve1)
                : (pool1Reserve1, pool1Reserve0, pool0Reserve1, pool0Reserve0);
        }
    }

     uint256 public profitaave;
     uint256 public BalanceBefore;
     address public baseTokenAave;
     bool public baseTokenSmaller;
     ////////////////////////aave arbitrage//////////////////////////////
     function flashArbitrageAave(address pool0, address pool1 ,uint borrowAmount) internal returns (bool) {
         (uint256 profit, address baseToken)= getProfit(pool0, pool1);
         profitaave = profit;
         baseTokenAave = baseToken;
        ArbitrageInfo memory info;
        (info.baseTokenSmaller, info.baseToken, info.quoteToken) = isbaseTokenSmaller(pool0, pool1);
          baseTokenSmaller = info.baseTokenSmaller;
        OrderedReserves memory orderedReserves;
        (info.lowerPool, info.higherPool, orderedReserves) = getOrderedReserves(pool0, pool1, info.baseTokenSmaller);
        // console.log("info.lowerPool:=====> ",info.lowerPool);
        // console.log("info.higherPool:=====>  ",info.higherPool);
        // console.log("orderedReserves: =====> ",orderedReserves.a1);
        // console.log("orderedReserves: =====> ",orderedReserves.b1);
        // console.log("orderedReserves: =====> ",orderedReserves.a2);
        // console.log("orderedReserves:=====>  ",orderedReserves.b2);

        // // this must be updated every transaction for callback origin authentication
        permissionedPairAddress = info.lowerPool;

        uint256 balanceBefore = IERC20(info.baseToken).balanceOf(address(this));
         BalanceBefore = balanceBefore;
            // avoid stack too deep error
            // (uint256 borrowAmount) = calcBorrowAmount(orderedReserves);
        {
            console.log("borrowAmount: ",borrowAmount);
            (uint256 amount0Out, uint256 amount1Out) = info.baseTokenSmaller ? (uint256(0), borrowAmount) : (borrowAmount, uint256(0));
            console.log("amount0Out=>", amount0Out ,"amount1Out=>",amount1Out);
            // borrow quote token on lower price pool, calculate how much debt we need to pay demoninated in base token
            uint256 debtAmount = getAmountIn(borrowAmount, orderedReserves.a1, orderedReserves.b1);
            console.log("borrow quote token from cheap pool==> ", debtAmount);
            // sell borrowed quote token on higher price pool, calculate how much base token we can get
            uint256 baseTokenOutAmount = getAmountOut(borrowAmount, orderedReserves.b2, orderedReserves.a2);
            console.log("sell borrowed quote token on higher price====>> ", baseTokenOutAmount);
        //     require(baseTokenOutAmount > debtAmount, 'Arbitrage fail, no profit');
            // can only initialize this way to avoid stack too deep error .
            CallbackData memory callbackData;
            callbackData.debtPool = info.lowerPool;
            callbackData.targetPool = info.higherPool;
            callbackData.debtTokenSmaller = info.baseTokenSmaller;
            callbackData.borrowedToken = info.quoteToken;
            callbackData.debtToken = info.baseToken;
            callbackData.debtAmount = debtAmount;
            callbackData.debtTokenOutAmount = baseTokenOutAmount;

            bytes memory data = abi.encode(callbackData);
            // console.log("info.lowerPool",info.lowerPool,amount0Out, amount1Out);
            IUniswapV2Pair(info.lowerPool).swap(amount0Out, amount1Out, address(this), data);
             return true;
        }

        // uint256 balanceAfter = IERC20(info.baseToken).balanceOf(address(this));
        // require(balanceAfter > balanceBefore, 'Losing money');

        // if (info.baseToken == WETH) {
        //     IWETH(info.baseToken).withdraw(balanceAfter);
        // }
        // permissionedPairAddress = address(1);
        // emit ArbitrageDataAddr(baseToken,pool0,pool1);
        // emit ArbitrageDataValue(borrowAmount,profit);
    }



        /// @notice Calculate how much profit we can by arbitraging between two pools
    function getProfit(address pool0, address pool1) public view returns (uint256 profit, address baseToken) {
        (bool baseTokenSmaller, , ) = isbaseTokenSmaller(pool0, pool1);
        // console.log("baseTokenSmaller======",baseTokenSmaller);
        baseToken = baseTokenSmaller ? IUniswapV2Pair(pool0).token0() : IUniswapV2Pair(pool0).token1();

        (, , OrderedReserves memory orderedReserves) = getOrderedReserves(pool0, pool1, baseTokenSmaller);
        // console.log("orderedReserves a1===",orderedReserves.a1);
        // console.log("orderedReserves b1===",orderedReserves.b1);
        uint256 borrowAmount = calcBorrowAmount(orderedReserves);
        // borrow quote token on lower price pool,  //calculate the base price in this pool
        uint256 debtAmount = getAmountIn(borrowAmount, orderedReserves.a1, orderedReserves.b1);
        // sell borrowed quote token on higher price pool  ////calculate the base price in this pool
        uint256 baseTokenOutAmount = getAmountOut(borrowAmount, orderedReserves.b2, orderedReserves.a2);
        if (baseTokenOutAmount < debtAmount) {  //based on token from pool a and b
            profit = 0;
        } else {
            profit = baseTokenOutAmount - debtAmount;
        }
    }

    /// @dev calculate the maximum base asset amount to borrow in order to get maximum profit during arbitrage
    function calcBorrowAmount(OrderedReserves memory reserves) internal pure returns (uint256 amount) {
        // console.log("minminminmin a1",reserves.a1);
        // console.log("minminminmin b1",reserves.b1);
        // console.log("minminminmin a2",reserves.a2);
        // console.log("minminminmin b2",reserves.b2);
        // we can't use a1,b1,a2,b2 directly, because it will result overflow/underflow on the intermediate result
        // so we:
        //    1. divide all the numbers by d to prevent from overflow/underflow
        //    2. calculate the result by using above numbers
        //    3. multiply d with the result to get the final result
        // Note: this workaround is only suitable for ERC20 token with 18 decimals, which I believe most tokens do
        uint256 min1 = reserves.a1 < reserves.b1 ? reserves.a1 : reserves.b1;
        // console.log("minminminmin 1111===",min1);
        uint256 min2 = reserves.a2 < reserves.b2 ? reserves.a2 : reserves.b2;
        // console.log("minminminmin 2222===",min2);
        uint256 min = min1 < min2 ? min1 : min2;
        
        // console.log("minminminmin  min ===",min);
        // choose appropriate number to divide based on the minimum number
        uint256 d;

        if (min > 1e24) {
            d = 1e20;
        // console.log("d1",d);
        } else if (min > 1e23) {
            d = 1e19;
        // console.log("d2",d);
        } else if (min > 1e22) {
            d = 1e18;
        // console.log("d3",d);
        } else if (min > 1e21) {
            d = 1e17;
        // console.log("d4",d);
        } else if (min > 1e20) {
            d = 1e16;
        // console.log("d5",d);
        } else if (min > 1e19) {
            d = 1e15;
        // console.log("d6",d);
        } else if (min > 1e18) {
            d = 1e14;
        // console.log("d7",d);
        } else if (min > 1e17) {
            d = 1e13;
        // console.log("d8",d);
        } else if (min > 1e16) {
            d = 1e12;
        // console.log("d9",d);
        } else if (min > 1e15) {
            d = 1e11;
        // console.log("d10",d);
        } else {
            d = 1e10;
        // console.log("d11",d);
        }
        console.log("ddddddddddd",d);

        (int256 a1, int256 a2, int256 b1, int256 b2) =
            (int256(reserves.a1 / d), int256(reserves.a2 / d), int256(reserves.b1 / d), int256(reserves.b2 / d));
        // console.log("divided_reserve a1",uint256(a1));
        // console.log("divided_reserve a2",uint256(a2));
        // console.log("divided_reserve b1",uint256(b1));
        // console.log("divided_reserve b2",uint256(b2));
        int256 a = a1 * b1 - a2 * b2;
        // console.log("aaaaaaaa",a);

        int256 b = 2 * b1 * b2 * (a1 + a2);
        // console.log("bbbbbbbbbbb",b);
        int256 c = b1 * b2 * (a1 * b2 - a2 * b1);
        // console.log("cccccccccc",c);

        (int256 x1, int256 x2) = calcSolutionForQuadratic(a, b, c);
        // console.log("cccccccccc  xxxx1",uint256(x1));
        // console.log("cccccccccc  xxxx2",uint256(x2));
        // console.log("cccccccccc  amount",uint256(x1) * d);
        
        // 0 < x < b1 and 0 < x < b2
        require((x1 > 0 && x1 < b1 && x1 < b2) || (x2 > 0 && x2 < b1 && x2 < b2), 'Wrong input order');
        amount = (x1 > 0 && x1 < b1 && x1 < b2) ? uint256(x1) * d : uint256(x2) * d;
    }

    /// @dev find solution of quadratic equation: ax^2 + bx + c = 0, only return the positive solution
    function calcSolutionForQuadratic(
        int256 a,
        int256 b,
        int256 c
    ) internal pure returns (int256 x1, int256 x2) {
        int256 m = b**2 - 4 * a * c;

        // m < 0 leads to complex number
        require(m > 0, 'Complex number');

        int256 sqrtM = int256(sqrt(uint256(m)));
        x1 = (-b + sqrtM) / (2 * a);
        x2 = (-b - sqrtM) / (2 * a);
    }

    /// @dev Newton’s method for caculating square root of n
    function sqrt(uint256 n) internal pure returns (uint256 res) {
        assert(n > 1);

        // The scale factor is a crude way to turn everything into integer calcs.
        // Actually do (n * 10 ^ 4) ^ (1/2)
        uint256 _n = n * 10**6;
        uint256 c = _n;
        res = _n;

        uint256 xi;
        while (true) {
            xi = (res + c / res) / 2;
            // don't need be too precise to save gas
            if (res - xi < 1000) {
                break;
            }
            res = xi;
        }
        res = res / 10**3;
    }

    // copy from UniswapV2Library
    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn, //weth
        uint256 reserveOut //token
    ) public pure returns (uint256 amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint256 numerator = reserveIn.mul(amountOut).mul(1000);
        uint256 denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }

    // copy from UniswapV2Library
    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256 amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint256 amountInWithFee = amountIn.mul(997);
        uint256 numerator = amountInWithFee.mul(reserveOut);
        uint256 denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

            /**
     * @dev Withdraw asset.
     * @param _assetAddress Asset to be withdrawn.
     */
    function withdraw(address _assetAddress) public onlyOwner {
        uint assetBalance;
        if (_assetAddress == ETHER) {
            (bool success,)=msg.sender.call{value:address(this).balance}("");
            require(success,"Transfer failed!");
        } else {
            assetBalance = IERC20(_assetAddress).balanceOf(address(this));
            IERC20(_assetAddress).transfer(msg.sender, assetBalance);
        }
        emit LogWithdraw(msg.sender, _assetAddress, assetBalance);
    }

        function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes memory data
    ) public {
        // access control
        require(msg.sender == permissionedPairAddress, 'Non permissioned address call');
        require(sender == address(this), 'Not from this contract');
        console.log("hii i'm called by loan pair");
        uint256 borrowedAmount = amount0 > 0 ? amount0 : amount1;
        CallbackData memory info = abi.decode(data, (CallbackData));

        IERC20(info.borrowedToken).transfer(info.targetPool, borrowedAmount);

        (uint256 amount0Out, uint256 amount1Out) =
            info.debtTokenSmaller ? (info.debtTokenOutAmount, uint256(0)) : (uint256(0), info.debtTokenOutAmount);
        console.log("before swap basetoken Balance==>",IERC20(info.debtToken).balanceOf(address(this)));
        IUniswapV2Pair(info.targetPool).swap(amount0Out, amount1Out, address(this), new bytes(0));
        console.log("after swap basetoken Balance==>",IERC20(info.debtToken).balanceOf(address(this)));
        IERC20(info.debtToken).transfer(info.debtPool, info.debtAmount);
        console.log("after payoff basetoken Balance==>",IERC20(info.debtToken).balanceOf(address(this)));
    }
}



