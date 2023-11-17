const fs = require('fs').promises
const express = require('express')
const axios = require('axios');
const https = require('https');
const request = require('request');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');


const app = express()
var port = process.env.PORT || '3000';

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("Live PCR Data")
})

// FETCH DATA FROM URL, CALL PCR_CALCULATION AND DO CALCULATIONS, RETURN DATA TO CLIENT
app.get('/getPcrData', async (req, res) => {
    const url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"

    const agent = new https.Agent({
        rejectUnauthorized: false, // Ignore SSL certificate errors
    });


    try {
        const response = await axios.get(url, {
            httpsAgent: agent
        });
        let returnData = PCR_CALCULATIONS(response.data)
        res.send(response)
    } catch (error) {
        console.log(error);
    }

})

// RETURN FILE DATA
app.get('/getLogData', async (req, res) => {
    let logData = await readFileData()
    res.send(logData)
})

// REMOEVE ALL DATA FROM FILE, FIRST CHECK PASSWORD
app.get('/removeLogData/:pass', async (req, res) => {
    let pass = req.params.pass;

    if (pass === "SHREYASH") {
        try {
            await fs.writeFile('api_log_file.txt', JSON.stringify({}))
            res.send("Data Removed Successfully")
        } catch (Error) {
            res.send(Error)
        }
    } else {
        res.send("WRONG PASSWORD")
    }

})

// Do Calculations
function PCR_CALCULATIONS(data) {

    let spotPrice = data.records.underlyingValue
    let strikePrice = 0;
    let strikePricesArray = data.records.strikePrices
    let indexOfStrikePrice = 0;
    let index_ITM = 0;
    let index_ATM = 0;
    let index_OTM = 0;

    /* find the spot price by comparing strike price also find the index of spot price */
    for (let i = 0; i < strikePricesArray.length; i++) {
        if (spotPrice < strikePricesArray[i]) {
            lower_strikePrice = strikePricesArray[i - 1]

            if (spotPrice - lower_strikePrice < 25) {
                indexOfStrikePrice = i - 1
            } else {
                indexOfStrikePrice = i
            }
            strikePrice = strikePricesArray[indexOfStrikePrice]
            break
        }
    }

    /* This searches the Strike price in Filtered Array*/
    for (let i = 0; i < data.filtered.data.length; i++) {
        if (data.filtered.data[i].strikePrice === strikePrice) {
            index_ITM = i - 1;
            index_ATM = i;
            index_OTM = i + 1;
            break;
        }
    }

    /* This is according to the formula of Website */
    let activeStrikeIndex = index_ATM;
    let start = activeStrikeIndex - 9;
    let end = activeStrikeIndex + 7;
    let PE_SumOfChangeInOpenInterest = 0;
    let CE_SumOfChangeInOpenInterest = 0;

    // console.log("Strike Starting: " + data.filtered.data[start].strikePrice)
    // console.log("Strike Ending: " + data.filtered.data[end].strikePrice)

    let calculationData = [];

    console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
    console.log("------------------------------")
    console.log("STRIKE_PRICE | PE_COI | CE_COI")
    console.log("------------------------------")
    for (let i = start; i <= end; i++) {
        PE_SumOfChangeInOpenInterest += data.filtered.data[i].PE.changeinOpenInterest
        console.log(data.filtered.data[i].strikePrice + " | " + data.filtered.data[i].PE.changeinOpenInterest + " | " + data.filtered.data[i].CE.changeinOpenInterest);
        CE_SumOfChangeInOpenInterest += data.filtered.data[i].CE.changeinOpenInterest

        let temporaryObject = {
            "Strike_price": data.filtered.data[i].strikePrice,
            "PE_CHANGE_IN_OI": data.filtered.data[i].PE.changeinOpenInterest,
            "CE_CHANGE_IN_OI": data.filtered.data[i].CE.changeinOpenInterest
        }

        calculationData.push(temporaryObject)

    }
    console.log("------------------------------")

    let activeStrikePCR = PE_SumOfChangeInOpenInterest / CE_SumOfChangeInOpenInterest
    activeStrikePCR = activeStrikePCR.toFixed(2)

    // console.log("Strike : " + data.filtered.data[index_ATM].strikePrice)
    // console.log("PE = " + PE_SumOfChangeInOpenInterest + " " + "CE = " + CE_SumOfChangeInOpenInterest)

    /* This populate the table */
    let date = new Date().toISOString().split('T')[0];
    let time = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();

    // console.log(date + " " + time + " " + "PCR : " + activeStrikePCR)

    let obj = {
        symbol: "NIFTY",
        date: date,
        time: time,
        pcr: activeStrikePCR,
        activeStrike: data.filtered.data[index_ATM].strikePrice,
        expiryDate: data.filtered.data[index_ATM].expiryDate,
        PE_SumOfChangeInOpenInterest: PE_SumOfChangeInOpenInterest,
        CE_SumOfChangeInOpenInterest: CE_SumOfChangeInOpenInterest
    }

    console.log(obj)


    dataForLog = {
        "sentToUser": obj,
        "supportingData": calculationData
    }
    appendDataInFile(dataForLog)

    return obj;

}

// READ DATA FROM FILE, CONVERT INTO OBJECT AND RETURN
async function readFileData() {
    const data = await fs.readFile("api_log_file.txt", "utf8");
    if (data.length != 0) {
        let fileDataObject = JSON.parse(data);
        return fileDataObject;
    }
    return {};
}

// WRITE DATA INTO FILE, FIRST READ AND THEN APPEND AT BACK
async function appendDataInFile(dataForLog) {

    let fileDataObject = await readFileData();
    size = Object.keys(fileDataObject).length
    fileDataObject[size + 1] = dataForLog

    try {
        await fs.writeFile('api_log_file.txt', JSON.stringify(fileDataObject))
    } catch (Error) {
        res.send(Error)
    }
}

app.listen(port, () => {
    console.log("Server is running on " + port)
})