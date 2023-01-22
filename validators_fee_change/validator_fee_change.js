const nearAPI = require("near-api-js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs')
const nearEnvs = ['testnet', 'mainnet'];
const telegramApiToken = ""; // The telegram bot API token
const telegramChatId = "";  // The telegram chat ID to sent notifications to
const oldPath = './validators.json'

const { connect } = nearAPI;

async function createConnection(env) {
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

async function getValidatorsList(near){
    const response = await near.connection.provider.status();
    return response.validators;
}

async function getValidationPercentage(validator, nearConnection){
    const response = await nearConnection.connection.provider.query({
        request_type: "call_function",
        finality: "final",
        account_id: validator,
        method_name: "get_reward_fee_fraction",
        args_base64: "",
      });
    const value = Buffer.from(response.result, 'base64').toString();
    const val = JSON.parse(value);
    return val["numerator"]/val["denominator"]*100
}

async function search(nameKey, myArray){
    for (let i=0; i < myArray.length; i++) {
        if (myArray[i].name === nameKey) {
            return myArray[i];
        }
    }
}

(async () => {

    var args = process.argv.slice(2);
    if (args.length != 1) {
        console.log("Usage: node validator_fee_change.js <Near Network (" + nearEnvs + ")>");
        process.exit(0);
    }

    if (!nearEnvs.includes(args[0])) {
        console.log("Unsupported near environment. Supported values are: " + nearEnvs);
        process.exit(0);
    }


    const nearConnection = await createConnection(args[0]);    
    const validators = await getValidatorsList(nearConnection);

    let valNew = []; 

    for await (const validator of validators){
        const fee = await getValidationPercentage(validator['account_id'], nearConnection);
        const valObj = {
            name: validator['account_id'],
            percentage: fee
        };
        valNew.push(valObj);
      };

    let firstExecution = false;
    let oldVal;

    try {
        if (fs.existsSync(oldPath)) {
            oldVal = fs.readFileSync(oldPath);
            oldVal = JSON.parse(oldVal);
        }
    } catch(err) {
        firstExecution = true
    }

    if(!firstExecution){
        for await (const valLoop of valNew){
            valLoopOld = await search(valLoop.name, oldVal)
            if(valLoop.percentage != valLoopOld.percentage){
                console.log("Validation percentage change for ", valLoop.name)
            }
        }
    }
    else{
        console.log("First execution")
    }

    fs.writeFileSync(oldPath, JSON.stringify(valNew));

  })();