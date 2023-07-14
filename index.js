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
        const response = await axios.get(url, {timeout: 5000});
        console.log(response.status);
        console.log(response.data);

        res.send(response.data)
    } catch (error) {
        console.log(error);
    }

   

})

// app.get('/getPcrData', (req, res) => {
//     const url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY";

//     const options = {
//         url,
//         timeout: 10000 // Increased timeout to 10 seconds
//     };

//     request(options, (error, response, body) => {
//         if (error) {
//             console.log(error);
//             res.status(500).send('Error occurred');
//         } else if (response.statusCode !== 200) {
//             console.log('Unexpected status code:', response.statusCode);
//             res.status(response.statusCode).send('Unexpected status code');
//         } else {
//             console.log(response.statusCode);
//             console.log(body);
//             res.send(body);
//         }
//     });
// });














app.listen(port, () => {
    console.log("Server is running on " + port)
  })