const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');


const APP_TOKEN = "tst:xTD0Tk5j6YNA3Bg1zoAAnOX2.dE5twIo6nLxHI8IEfUaVMdJ4wzoL7SNq"
const APP_SECRET_KEY = "4R5P8VQZLvw8WQCPXsJyEzTKdEt2pCt8"
const APP_LEVEL_NAME = 'Basic%20KYC'
const HOST_URL = 'https://test-api.sumsub.com'

function createSignature(config) {
    //Creating timestamp as required in docs
    var ts = Math.floor(Date.now() / 1000);

    //Creating signature as required in docs
    const signature = crypto.createHmac('sha256',  APP_SECRET_KEY);
    signature.update(ts + config.method.toUpperCase() + config.url);
    if (config.data instanceof FormData) {
      signature.update (config.data.getBuffer());
    } else if (config.data) {
      signature.update (config.data);
    }
  
    //Adding authorization headers
    config.headers['X-App-Access-Ts'] = ts;
    config.headers['X-App-Access-Sig'] = signature.digest('hex');
    config.headers['X-App-Token'] = APP_TOKEN
  
    return config;
  }

//Adding authorization headers for every request made by axios
axios.interceptors.request.use(createSignature)

//Creating async main function to use await
async function main() {

    console.log("Creating applicant")
    //Creating our random extarnal id
    const externalUserId = 'AntonId' + Math.random()

    //Making first request (creating user)
    const createUserResponse = await axios({
        baseURL: HOST_URL,
        url:'/resources/applicants?levelName=' + APP_LEVEL_NAME,
        method: 'POST',
        headers: {
            //Header for data format that we are sending
            'Content-Type': 'application/json',
        },
        //Transforming json to text
        data: JSON.stringify({
            externalUserId: externalUserId
        })
    })

    //Getting user id from the applicant creation response
    const applicantId = createUserResponse.data.id

    console.log("Applicant created with id: " + applicantId)

    console.log('Adding document')

    //Adding path to image
    const filePath = 'tomas.jpeg'

    //Creating empty FormData
    const formData = new FormData()

    //Adding image as binary code
    formData.append('content', fs.readFileSync(filePath))

    //Adding required metadata as in docs
    formData.append('metadata', JSON.stringify({
        idDocType: "PASSPORT",
        country: 'RUS'
    }))

    //Making second request (add document image)
    const addDocumentResponce = await axios({
        baseURL: HOST_URL,
        url:'/resources/applicants/' + applicantId + '/info/idDoc',
        method: 'POST',
        //Header for data format that we are sending
        headers: {
            'Content-Type': formData.getHeaders()['content-type']
        },
        data: formData
    })

    console.log('Document added with metadata: '+ JSON.stringify(addDocumentResponce.data))


    console.log('Approving applicant')


    // Created try catch to capture error

    // Seems like the authorization tokens should be set up differenlty from the way that we did
    // for the requests above.
    try{
        const applicantApproveResponse = await axios({
            baseURL: HOST_URL,
            url:'/resources/applicants/' + applicantId + '/status/testCompleted',
            method: 'POST',

            data: JSON.stringify({
                reviewAnswer: "GREEN",
                rejectLabels: []
            })
        })
    }
    catch (e) {
        console.log("ERROR: ", e.response.data)
    }

}

main()


