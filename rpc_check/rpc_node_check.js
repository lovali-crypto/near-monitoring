const nearAPI = require("near-api-js");
const { connect } = nearAPI;
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const nearEnvs = ['testnet', 'mainnet'];
const telegramApiToken = ""; // The telegram bot API token
const telegramChatId = "";  // The telegram chat ID to sent notifications to
const blocksThreshold = 10;


async function compareVersion(env, remoteIP) {
    const remoteConfig = await getRemoteVersion(env);
    const localConfig = await getLocalVersion(remoteIP);

    if (remoteConfig.protocol_version == localConfig.protocol_version) {
        console.log("NEAR protocol version check OK! running version: " + localConfig.protocol_version);
    } else {
        console.log("NEAR protocol version check NOK! remote version: " + remoteConfig.protocol_version + ", local version: " + localConfig.protocol_version);
        sendTelegramMessage("NEAR protocol version check NOK! remote version: " + remoteConfig.protocol_version + ", local version: " + localConfig.protocol_version);
    }

    if(Math.abs(remoteConfig.sync_info.latest_block_height - localConfig.sync_info.latest_block_height) < blocksThreshold) {
        console.log("Last block check OK! latest height: " + localConfig.sync_info.latest_block_height);
    } else {
        console.log("Last block check NOK! remote height: " + remoteConfig.sync_info.latest_block_height + ", local height: " + localConfig.sync_info.latest_block_height);
        sendTelegramMessage("Last block check NOK! remote height: " + remoteConfig.sync_info.latest_block_height + ", local height: " + localConfig.sync_info.latest_block_height);
    }

    if(localConfig.sync_info.syncing){
        console.log("Node is syncing");
        sendTelegramMessage("Node is syncing");
    }

    if (remoteConfig.version.version == localConfig.version.version) {
        console.log("Nearcore version check OK! running version: " + localConfig.version.version);
    } else {
        console.log("Nearcore version check NOK! remote version: " + remoteConfig.version.version + ", local version: " + localConfig.version.version);
        sendTelegramMessage("Nearcore version check NOK! remote version: " + remoteConfig.version.version + ", local version: " + localConfig.version.version);
    }

    if (remoteConfig.version.rustc_version == localConfig.version.rustc_version) {
        console.log("Nearcore version check OK! running version: " + localConfig.version.rustc_version);
    } else {
        console.log("Nearcore version check NOK! remote version: " + remoteConfig.version.rustc_version + ", local version: " + localConfig.version.rustc_version);
        sendTelegramMessage("Nearcore version check NOK! remote version: " + remoteConfig.version.rustc_version + ", local version: " + localConfig.version.rustc_version);
    }
}

async function sendTelegramMessage(text){

    let urlString = `https://api.telegram.org/bot${telegramApiToken}/sendMessage?chat_id=${telegramChatId}&text=${text}`;

    let request = new XMLHttpRequest();
    request.open("GET", urlString);
    request.send();

    let response = request.response;
}

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
    const response = await near.connection.provider.status();
    return response;
}

async function getLocalVersion(remoteIP) {
    const config = {
        networkId: "testnet",
        nodeUrl: "http://" + remoteIP + ":3030",
        walletUrl: "https://wallet.testnet.near.org",
        helperUrl: "https://helper.testnet.near.org",
        explorerUrl: "https://explorer.testnet.near.org",
    };
    try{
        const near = await connect(config);
        const response = await near.connection.provider.status();
        return response;
    }
    catch{
        sendTelegramMessage("Problem retrieving node informations. Node ip: " + remoteIP )
    }

}

// parse args
var args = process.argv.slice(2);
if (args.length != 2) {
    console.log("Usage: node rpc_node_check.js <Near Network (" + nearEnvs + ")> <rpc node address>");
    process.exit(0);
}

if (!nearEnvs.includes(args[0])) {
    console.log("Unsupported near environment. Supported values are: " + nearEnvs);
    process.exit(0);
}

compareVersion(args[0], args[1]);