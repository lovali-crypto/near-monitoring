const nearAPI = require("near-api-js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const nearEnvs = ['testnet', 'mainnet'];
const telegramApiToken = ""; // The telegram bot API token
const telegramChatId = "";  // The telegram chat ID to sent notifications to

const { connect } = nearAPI;
const threshold = (188490620205846000000000 + 781781985304112475096) * 2; // The configurable threshold

async function getRemoteVersion(env) {
    let config;
    switch (env) {
        case 'testnet':
            config = {
                networkId: "testnet",
                nodeUrl: "https://rpc.testnet.near.org",
                walletUrl: "https://wallet.testnet.near.org",
                helperUrl: "https://helper.testnet.near.org",
                explorerUrl: "https://explorer.testnet.near.org",
            };
            break;
        case 'mainnet':
            config = {
                networkId: "mainnet",
                nodeUrl: "https://rpc.mainnet.near.org",
                walletUrl: "https://wallet.mainnet.near.org",
                helperUrl: "https://helper.mainnet.near.org",
                explorerUrl: "https://explorer.mainnet.near.org",
            };
            break;
        default:
            console.log("Invalid near environment: " + env);
            return;
    }

    const near = await connect(config);
    return near;
}

async function sendTelegramMessage(text){

    let urlString = `https://api.telegram.org/bot${telegramApiToken}/sendMessage?chat_id=${telegramChatId}&text=${text}`;

    let request = new XMLHttpRequest();
    request.open("GET", urlString);
    request.send();

    let response = request.response;
}

(async () => {

    var args = process.argv.slice(2);
    if (args.length != 2) {
        console.log("Usage: node chec_balance.js <Near Network (" + nearEnvs + ")> <near account>");
        process.exit(0);
    }

    if (!nearEnvs.includes(args[0])) {
        console.log("Unsupported near environment. Supported values are: " + nearEnvs);
        process.exit(0);
    }


    const nearConnection = await getRemoteVersion(args[0]);

      // gets account balance
      const account = await nearConnection.account(args[1]);
      const balance = await account.getAccountBalance();

      if (balance.available < threshold){
        sendTelegramMessage("Low balance for user " + args[1] + ", amount: " + balance.available);
      }
      else {
        console.log("Available balance: " + balance.available + ", threshold: " + threshold);
      }

  })();