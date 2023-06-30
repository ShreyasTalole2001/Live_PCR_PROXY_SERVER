const express = require('express')
const axios = require('axios');
const cors = require('cors');
var cookieParser = require('cookie-parser');

const app = express()
var port = process.env.PORT || '3000';


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


// app.get('/', (req, res) => {
//     res.send("jhdkjfh")
// })


app.get('/getPcrData', async (req, res) => {

    const url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"

    try {
        const response = await axios.get(url);
        console.log(response.status);
        console.log(response.data);

        res.send(response.data)
    } catch (error) {
        console.log(error);
    }

   

})




app.listen(port, () => {
    console.log("Server is running on " + port)
  })