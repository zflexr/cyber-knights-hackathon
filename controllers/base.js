const { default: axios } = require("axios");
const { TextServiceClient } = require("@google-ai/generativelanguage").v1beta2;
const { GoogleAuth } = require("google-auth-library");
require('dotenv').config()

const MODEL_NAME = process.env.MODEL_NAME;
const API_KEY = process.env.MODEL_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

exports.runIt = async function(contractAddress) {
    const contract = await getContractFromEtherscan(contractAddress)
    if (contract == "Contract source code not verified") {
        return {safe: false, summary: "Contract source code not verified"}
    }
    return pipeContractToPalm2(contract)
}

async function getContractFromEtherscan(contractAddress) {
    try {
        const res = await axios.get(`https://api-goerli.etherscan.io/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`)
    if (res.data.result[0].ABI === "Contract source code not verified") {
        return "Contract source code not verified"
    }
    const source = res.data.result[0].SourceCode
    const sourceMod = source.slice(1, -1)
    const sourceModJSON = JSON.parse(sourceMod)
    const dynamicKey = Object.keys(sourceModJSON.sources)[0];
    const content = sourceModJSON.sources[dynamicKey].content;
    return content
    } catch (error) {
        console.log(error)
        throw error
    }
}

async function pipeContractToPalm2(contract) {
    const client = new TextServiceClient({
        authClient: new GoogleAuth().fromAPIKey(API_KEY),
    });

    const prompt1 = `Yes or No is this contract safe: "${contract}". Do not add any extras, just yes or no`;
    const prompt2 = `Audit this contract "${contract}"`;

    try {
        let result = await client.generateText({
            model: MODEL_NAME,
            prompt: {
            text: prompt1,
            },
        })
        if (result[0].candidates[0].output.toLowerCase() == "yes") {
            return {safe: true, summary: ""}
        }
        result = await client.generateText({
            model: MODEL_NAME,
            prompt: {
            text: prompt2,
            },
        })
        return {safe: false, summary: result[0].candidates[0].output}
    } catch (error) {
        console.log(error)
        throw error
    }
}