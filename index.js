const express = require('express')
const axios = require('axios');
const cors = require('cors');
var cookieParser = require('cookie-parser');
const request = require('request');

const app = express()
var port = process.env.PORT || '3000';

app.use(cors({origin: '*'}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send("Testing")
})

app.get('/getPcrData', async (req, res) => {

    const url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"

    try {
        const response = await axios.get(url);
        let returnData = PCR_CALCULATIONS(response.data)
        res.send(returnData)
    } catch (error) {
        console.log(error);
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

    for (let i = start; i <= end; i++) {
        PE_SumOfChangeInOpenInterest += data.filtered.data[i].PE.changeinOpenInterest
        console.log(data.filtered.data[i].strikePrice + " " + data.filtered.data[i].PE.changeinOpenInterest);
        CE_SumOfChangeInOpenInterest += data.filtered.data[i].CE.changeinOpenInterest
    }

    let activeStrikePCR = PE_SumOfChangeInOpenInterest / CE_SumOfChangeInOpenInterest
    activeStrikePCR = activeStrikePCR.toFixed(2)

    console.log("Strike : " + data.filtered.data[index_ATM].strikePrice)
    console.log("PE = " + PE_SumOfChangeInOpenInterest + " " + "CE = " + CE_SumOfChangeInOpenInterest)

    /* This populate the table */
    let date = new Date().toISOString().split('T')[0];
    let time = new Date().getHours() + ":" + new Date().getMinutes() + ":" + new Date().getSeconds();

    console.log(date +" "+time+" "+activeStrikePCR)

    let obj = {
        symbol : "NIFTY",
        date : date,
        time : time,
        pcr : activeStrikePCR,
        activeStrike : data.filtered.data[index_ATM].strikePrice,
        expiryDate : data.filtered.data[index_ATM].expiryDate
    }

    return obj;
    
}


app.listen(port, () => {
    console.log("Server is running on " + port)
  })