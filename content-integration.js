const {ipcRenderer} = require('electron');
const axios = require('axios').default;
const fs = require('fs');
const stringify = require('querystring').stringify;

ipcRenderer.on('log' , function(event , data){
    log(data);
});

const downloadResources = (form) => {
    clearLog();
    try {
        const token = form.token.value;
        const payload = JSON.parse(form.payload.value);
        axios({
            url: 'http://dev-contents.smarted.cloud/api/resources/download-info',
            method: 'POST',
            data: payload,
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            if (response.data.length) {
                log("JSON de descargas recuperado correctamente.");
                response.data.map(resourceInfo => {
                    if (resourceInfo.launcher) {
                        copyToLocalDb(resourceInfo);
                        printResource(resourceInfo.id);
                    }
                    if (resourceInfo.url) {
                        storeResouceOnDisk(resourceInfo);
                    }
                });
            } else {
                log("No se ha encontrado el recurso.");
            }
        }).catch(error => {
            log(error);
        });
    } catch (error) {
        log(error);
    }
    return false;
};

const copyToLocalDb = (resource) => {
    localStorage.setItem(resource.id, resource.launcher);
    log(`Se guarda el recurso ${resource.id} en localStorage`);
};

const storeResouceOnDisk = (resourceInfo) => {
    const folder = `${__dirname}/resources/${resourceInfo.id}/`;
    createFolder(folder);
    ipcRenderer.send('download', resourceInfo.url, folder);
    log(`Descargando ${resourceInfo.url}`);
};

function createFolder(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
        return log(`El directorio ${folder} ha sido creado`);
    }
    log(`El directorio ${folder} ya existe`)
}

const log = (text) => {
    const logArea = document.getElementById("logArea");
    logArea.innerHTML = logArea.innerHTML + text + "\n";
    logArea.scrollTop = logArea.scrollHeight;
};

const clearLog = () => {
    const logArea = document.getElementById("logArea");
    logArea.innerHTML = "";
};

const printResource = (key) => {
    const resourceUrl = localStorage.getItem(key);
    const resourceElement = document.createElement('a');
    const linkText = document.createTextNode(key);
    resourceElement.appendChild(linkText);
    resourceElement.title = key;
    resourceElement.href = resourceUrl;
    document.getElementById("resourceList").appendChild(resourceElement);
};

const getToken = () => {
    axios({
        url: 'http://dev-auth.smarted.cloud/api/v1/oauth/token',
        method: 'POST',
        data: stringify({
            'grant_type': 'trusted_client_user_id',
            'user_id': 'ad169e09-a79e-401c-b100-4a5cc7167e0e'
        }),
        headers: {
            Authorization: `Basic c21hcnRlZC14dW50YTphZ3JlZWQtc2V0dGxlZC1NT05FWS1uZXJ2ZQ==`
        }
    }).then(response => {
        document.getElementById('token').value = response.data.access_token;
        log("Token actualizado.");
    }).catch(error => {
        log(`Error al obtener el token: ${error}`);
    });
};

getToken();
