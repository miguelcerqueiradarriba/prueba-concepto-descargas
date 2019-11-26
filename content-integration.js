const {ipcRenderer} = require('electron');
const axios = require('axios').default;
const fs = require('fs');
const stringify = require('querystring').stringify;
const unzipper = require('unzipper');

const ENVIRONMENT_URL = 'http://localhost/';
const RESOURCES_PATH = 'resources/';

const activities = [];
const downloads = [];

const downloadResourcesHandler = (form) => {
    clearData();
    downloadResources(form.token.value, JSON.parse(form.payload.value));
    return false;
};

const downloadActivityHandler = (form) => {
    clearData();
    try {
        log("Pidiendo Activity... ");
        const token = form.token.value;
        const activityId = form.activityId.value;
        const query = stringify({page: 0, size: 100, depth: 5, id: activityId});
        axios({
            url: `http://dev-contents.smarted.cloud/api/activities?${query}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            const resourceIds = [];
            if (response.data && response.data._embedded) {
                log(`Activity recuperado correctamente: ${JSON.stringify(response.data._embedded.activities)}`);
                response.data._embedded.activities.map(activityInfo => {
                    if (activityInfo.resourceId) {
                        resourceIds.push({id: activityInfo.resourceId});
                        activities.push(activityInfo);
                    }
                });
            } else {
                log("No se ha encontrado el recurso.");
            }
            downloadResources(token, resourceIds);
        }).catch(error => {
            log(error);
        });
    } catch (error) {
        log(error);
    }
    return false;
};

const downloadResources = (token, payload) => {
    try {
        log("Pidiendo recursos...");
        setTimeout(() => {
            axios({
                url: 'http://dev-contents.smarted.cloud/api/resources/download-info',
                method: 'POST',
                data: payload,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }).then(response => {
                if (response.data.length) {
                    log(`Recursos recuperados correctamente: ${JSON.stringify(response.data)}`);
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
        }, 1000);
    } catch (error) {
        log(error);
    }
};

const copyToLocalDb = (resource) => {
    localStorage.setItem(resource.id, resource.launcher);
    log(`Se guarda el recurso ${resource.id} en localStorage con valor ${resource.launcher}`);
};

const storeResouceOnDisk = (resourceInfo) => {
    const folder = `${__dirname}/resources/${resourceInfo.id}/`;
    createFolder(folder);
    downloads.push({url: resourceInfo.url, folder});
};

function createFolder(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, {recursive: true});
        return log(`Ha sido creado el directorio ${folder}`);
    }
    log(`Ya existe el directorio ${folder}`)
}

const log = (text) => {
    const logArea = document.getElementById("logArea");
    logArea.innerHTML = logArea.innerHTML + text + "\n";
    logArea.scrollTop = logArea.scrollHeight;
};

const clearData = () => {
    clearLog();
    clearResources();
};

const clearLog = () => {
    const logArea = document.getElementById("logArea");
    logArea.innerHTML = "";
};

const clearResources = () => {
    document.getElementById("resourceList").innerHTML = "";
};

const printResource = (key) => {
    const resourceUrl = localStorage.getItem(key);
    const div = document.createElement('div');
    const resourceElement = document.createElement('a');
    const activity = activities.find(activity => activity.resourceId === key);
    const linkText = document.createTextNode(activity ? activity.name : key);
    resourceElement.appendChild(linkText);
    resourceElement.title = key;
    resourceElement.href = ENVIRONMENT_URL + RESOURCES_PATH + resourceUrl;
    resourceElement.target = '_blank';
    div.appendChild(resourceElement);
    document.getElementById("resourceList").appendChild(div);
};

const extractZips = (folder) => {
    fs.readdir(folder, (err, files) => {
        files.forEach(file => {
            if (file.endsWith('.zip')) {
                fs.createReadStream(folder + file)
                    .pipe(unzipper.Extract({path: folder}));
                fs.unlink(folder + file, () => {
                    log(`Se ha descomprimido ${folder + file} y luego se ha borrado.`)
                });
            }
        });
    });
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
        document.getElementById('resourceToken').value = response.data.access_token;
        document.getElementById('activityToken').value = response.data.access_token;
        log("Token actualizado.");
    }).catch(error => {
        log(`Error al obtener el token: ${error}`);
    });
};

ipcRenderer.on('itemDownloaded', function (event, data) {
    downloads.shift();
    log(`Se ha descargado ${data.url}`);
    extractZips(data.folder);
});

ipcRenderer.on('downloadError', function (event, data) {
    downloads.shift();
    log(`No se ha podido descargar ${data.url}`);
});

function downloader() {
    if (downloads[0]) {
        if (!downloads[0].downloading) {
            downloads[0].downloading = true;
            const { url, folder } = downloads[0];
            ipcRenderer.send('download', url, folder);
            log(`Descargando ${url}`);
        } else {
            log("...");
        }
    }
}

// Se aplica una política de una descarga a la vez, ya que si no la librería de descargas daba problemas
setInterval(downloader, 1000);
getToken();
