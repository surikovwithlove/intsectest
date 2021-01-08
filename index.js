const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const FormData = require('form-data');


const APP_TOKEN = "tst:xTD0Tk5j6YNA3Bg1zoAAnOX2.dE5twIo6nLxHI8IEfUaVMdJ4wzoL7SNq"
const APP_SECRET_KEY = "4R5P8VQZLvw8WQCPXsJyEzTKdEt2pCt8"
const APP_LEVEL_NAME = 'Basic%20KYC'
const HOST_URL = 'https://test-api.sumsub.com'

function createSignature(config) {
    var ts = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256',  APP_SECRET_KEY);
    signature.update(ts + config.method.toUpperCase() + config.url);
 
    if (config.data instanceof FormData) {
      signature.update (config.data.getBuffer());
    } else if (config.data) {
      signature.update (config.data);
    }
  
    config.headers['X-App-Access-Ts'] = ts;
    config.headers['X-App-Access-Sig'] = signature.digest('hex');
    config.headers['X-App-Token'] = APP_TOKEN
  
    return config;
  }

axios.interceptors.request.use(createSignature)

async function main() {

    console.log("Creating applicant")
    const externalUserId = 'AntonId' + Math.random()
    const createUserResponse = await axios({
        baseURL: HOST_URL,
        url:'/resources/applicants?levelName=' + APP_LEVEL_NAME,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({
            externalUserId: externalUserId
        })
    })

    const applicantId = createUserResponse.data.id

    console.log("Applicant created with id: " + applicantId)

    console.log('Adding document')

    const filePath = 'tomas.jpeg'
    const formData = new FormData()

    formData.append('content', fs.readFileSync(filePath))
    formData.append('metadata', JSON.stringify({
        idDocType: "PASSPORT",
        country: 'RUS'
    }))

    const addDocumentResponce = await axios({
        baseURL: HOST_URL,
        url:'/resources/applicants/' + applicantId + '/info/idDoc',
        method: 'POST',
        headers: {
            'Content-Type': formData.getHeaders()['content-type']
        },
        data: formData
    })

    console.log('Document added with metadata: '+ JSON.stringify(addDocumentResponce.data))


    console.log('Approving applicant')

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
        console.log(applicantApproveResponse.data)
    }
    catch (e) {
        console.log(e.response.data)
    }

}

main()


