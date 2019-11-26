const {ipcMain, app, BrowserWindow} = require('electron');
const {download} = require('electron-dl');

let win;

function createWindow() {
    // Crea la ventana del navegador.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    win.loadFile('index.html');

    // Abre las herramientas de desarrollo (DevTools).
    win.webContents.openDevTools();

    // Emitido cuando la ventana es cerrada.
    win.on('closed', () => {
        // Elimina la referencia al objeto window, normalmente  guardarías las ventanas
        // en un vector si tu aplicación soporta múltiples ventanas, este es el momento
        // en el que deberías borrar el elemento correspondiente.
        win = null
    });

    win.maximize();

    win.webContents.session.clearCache();

}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
// Algunas APIs pueden usarse sólo después de que este evento ocurra.
app.on('ready', createWindow);

// Sal cuando todas las ventanas hayan sido cerradas.
app.on('window-all-closed', () => {
    // En macOS es común para las aplicaciones y sus barras de menú
    // que estén activas hasta que el usuario salga explicitamente con Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});

app.on('activate', () => {
    // En macOS es común volver a crear una ventana en la aplicación cuando el
    // icono del dock es clicado y no hay otras ventanas abiertas.
    if (win === null) {
        createWindow()
    }
});

ipcMain.on('download', (event, url, folder) => {
    download(win, url, {directory: folder}).then(() => {
        win.webContents.send('itemDownloaded', {url, folder});
    }).catch(error => {
        win.webContents.send('downloadError', {url, folder});
        console.log(error);
    });
});
