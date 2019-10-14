const {ipcRenderer} = require('electron');
const axios = require('axios').default;
const fs = require('fs');

const downloadResources = (form) => {
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
            log("JSON de descargas recuperado correctamente.");
            response.data.map(resourceInfo => {
                if (resourceInfo.launcher) {
                    copyToLocalDb(resourceInfo);
                }
                if (resourceInfo.url) {
                    storeResouceOnDisk(resourceInfo);
                }
            });
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
    logArea.innerText = logArea.innerText + text;
};
