//Code by Keja Wright-Thompson

console.log('Hello from Electron 👋')
const { app, BrowserWindow, ipcMain } = require('electron/main')

const path = require('node:path')

const createWindow = () => {
  const win = new BrowserWindow({
    width: 615,
    height: 455,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#c76e06',
      symbolColor: '#000000',
      height: 20,
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  ipcMain.handle('ping', () => 'pong')
  ipcMain.on('set-titlebar-color', (event, color) => {
    if (typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color)) return
    const window = BrowserWindow.fromWebContents(event.sender)
    window?.setTitleBarOverlay({ color })
  })
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})