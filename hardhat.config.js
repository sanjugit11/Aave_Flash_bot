require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // solidity: {
  //   version: "0.8.19",
  //   settings: {
  //     optimizer: {
  //       enabled: true,
  //       runs: 200,
  //     },
  //   },
  // },

solidity: {
    compilers: [
      {
        version: "0.8.10",
          settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      // Add more compiler versions as needed
    ],
  },




  hardhat: {
    allowUnlimitedContractSize: true,
  },
  networks: {
    sepolia:{
      // url: "https://sepolia.infura.io/v3/",
      url: "https://ethereum-sepolia-rpc.publicnode.com	",
      chainId: 11155111,
      accounts: ["543cc07c9230cf1ca477abaad96b78232d0ab526f9db54f2cf4bf01eb8b8ec0d"],
      gas: 2100000,
      gasPrice: 8000000000,
      saveDeployments: true,
    },
    bscTestnet: {
      // url: "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
      url: "https://endpoints.omniatech.io/v1/bsc/testnet/public",
      chainId: 97,
      accounts: [
        "543cc07c9230cf1ca477abaad96b78232d0ab526f9db54f2cf4bf01eb8b8ec0d",
      ],
      
    },
    mumbai: {
      url: "https://polygon-mumbai-pokt.nodies.app",
      chainId: 80001,
      accounts: [
        "543cc07c9230cf1ca477abaad96b78232d0ab526f9db54f2cf4bf01eb8b8ec0d",
      ],
    },
  },
  etherscan: {
    // apiKey: "ETG1DI3IVA14X293WQ3R2PT5C1IIJ58FJ5",  //etherscan
    apiKey: "H7SFE79M996JRTMAKXIECPFCZIX5245X6P",  //polygon
  },
  // etherscan: {
  //   apiKey: {
  //     // buildbear: "verifyContract",
  //     bscTestnet: 'GTCUVY9VZ3W17WZGCTDCRDDF9UXSNHJGWQ'
  //   },
  //   customChains: [
  //     {
  //       network: "buildbear",
  //       chainId: 12101,
  //       urls: {
  //         apiURL: "https://rpc.buildbear.io/verify/etherscan/distant-beru-whitesun-lars-c1689916",
  //         browserURL: "https://explorer.buildbear.io/distant-beru-whitesun-lars-c1689916",
  //       },
  //     },
  //   ],
  // },
};
