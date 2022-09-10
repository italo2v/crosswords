const {app, BrowserWindow, session, dialog} = require('electron')
const { ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const controls = require('./Control/controls.js')
const baseURL = 'http://localhost/'

listControls = [
  {listen: 'load-board', control: controls.loadBoard},
  {listen: 'get-board', control: controls.getBoard},
  {listen: 'register-board', control: controls.registerBoard},
  {listen: 'delete-board', control: controls.deleteBoard},
  {listen: 'update-board', control: controls.updateBoard},
  {listen: 'save-board', control: controls.saveBoard},
  {listen: 'get-lastsavedboard', control: controls.getLastSavedBoard},
  {listen: 'list-boards', control: controls.listBoards},
  {listen: 'register-class', control: controls.registerClass},
  {listen: 'delete-class', control: controls.deleteClass},
  {listen: 'list-classes', control: controls.listClasses},
  {listen: 'list-languages', control: controls.listLanguages},
  {listen: 'evaluate-board', control: controls.evaluateBoard},
  {listen: 'register-dictionary', control: controls.registerDictionary},
  {listen: 'update-dictionary', control: controls.updateDictionary},
  {listen: 'delete-dictionary', control: controls.deleteDictionary},
  {listen: 'get-dictionaries', control: controls.getDictionaries},
  {listen: 'list-dictionaries', control: controls.listDictionaries},
  {listen: 'get-dictionary', control: controls.getDictionary},
  {listen: 'generate-randomboard', control: controls.generateRandomBoard},
  {listen: 'get-randomboard', control: controls.getRandomBoard},
  {listen: 'get-systemconfig', control: controls.getSystemConfig},
  {listen: 'update-systemconfig', control: controls.updateSystemConfig},
  {listen: 'change-adminpassword', control: controls.changeAdminPassword}
]


listControls.forEach( (item) => {
  ipcMain.on(item.listen, (event, arg) => {
    item.control(arg, (result) => {
      event.reply(item.listen, result)
    })
  })
})

ipcMain.on('change-language', (event, language) => {
  const cookie = { url: baseURL, name: 'language', value: language, expirationDate: new Date().getTime()+30*24*3600*1000}
  session.defaultSession.cookies.set(cookie)
  .then(()=>{
      getLanguage( (datalanguage) => {
        event.reply('change-language', datalanguage)
      })
  }, (error) => {
    console.error(error)
  })
})

ipcMain.on('login', (event, data) => {
  data = data.arg
  controls.getAdminPassword('', (adminpasswd)=>{
    if(data.login == 'admin' && data.password == adminpasswd){
      const cookie = { url: baseURL, name: 'login', value: data.password, expirationDate: new Date().getTime()+30*24*3600*1000}
      session.defaultSession.cookies.set(cookie)
      .then(()=>{
        event.reply('login', 'authenticated')
      }, (error) => {
        console.error(error)
      })
    }else{
      event.reply('login', 'invalidlogin')
    }

  })
})

ipcMain.on('data-import', (event, obj)=>{
  settings = {
    defaultPath: app.getPath('home')+'/Downloads/',
    filters: [{ 'name': 'Json', 'extensions': ['json'] }],
    title: obj.arg.title
  }
  if(process.platform !== 'darwin')// If the platform is 'win32' or 'Linux'
    settings.properties = ['openFile']
  else
    settings.properties = ['openFile', 'openDirectory'] // Specifying the File Selector and Directory in MacOS
  dialog.showOpenDialog(settings).then(file => {
      if (!file.canceled) {
        try{
          fs.readFile(file.filePaths[0].toString(), (error, data)=>{
            if(error == null){
              try{
                obj.arg = JSON.parse(data)
              }catch(error){
                event.reply('data-import', 'invalidfile')
              }
              controls.importData(obj, (result)=>{
                event.reply('data-import', result)
              })
            }else{
              event.reply('data-import', 'fileerror')
            }
          })
        }catch(error){
          console.log(error)
        }
      }
  }).catch(err => {
      console.log(err)
  })
})

ipcMain.on('data-export', (event, obj) => {
  settings = {
    defaultPath: app.getPath('home')+'/Downloads/crosswords.json',
    filters: [{ 'name': 'Json', 'extensions': ['json'] }],
    title: obj.arg.title
  }
  let customURL = dialog.showSaveDialogSync(settings)
  if(customURL)
    controls.exportData(obj, (result)=>{
      if(result == 'invaliduser')
        event.reply('data-export', result)
      else
        fs.writeFile(customURL, JSON.stringify(result), (err)=>{
          if (err) throw err
          console.log('Data exported to '+customURL)
          event.reply('data-export', 'dataexported')
        })
    })
})

ipcMain.on('quit', (event) => {
  app.quit()
})

function getLanguage(callback){
  session.defaultSession.cookies.get({ url: baseURL, name: 'language'}).then((cookies) => {
    if(typeof cookies[0] != 'undefined'){
      controls.getLanguage(cookies[0].value, (datalanguage)=>{
        callback(datalanguage)
      })
    }else{
      controls.getLanguageSystem( (datalanguage)=>{
        callback(datalanguage)
      })
    }
  }).catch((error) => {
    console.log(error)
  })
}

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, './crossword.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('./View/index.html')
  mainWindow.webContents.on('did-finish-load', () => {
  mainWindow.removeMenu()
  mainWindow.setMenuBarVisibility(false)
    controls.systemConfig.userDataPath = (app || remote.app).getPath('userData')
    controls.systemConfig.appPath = (app || remote.app).getAppPath()
    controls.getSystemConfig('', (config)=>{
      config.userDataPath = controls.systemConfig.userDataPath
      controls.systemConfig = config
      getLanguage( (datalanguage) => {
        mainWindow.webContents.send('change-language', datalanguage)
        controls.getAdminPassword('', (passwd)=>{
          if(passwd == 'jZae727K08KaOmKSgOaGzww/XVqGr/PKEgIMkjrcbJI='){ //'123456'
            mainWindow.webContents.send('change-adminpassword')
          }
        })
      })
    })
  })

  // Open the DevTools.
<<<<<<< HEAD
  //devtools = new BrowserWindow()
  //mainWindow.webContents.setDevToolsWebContents(devtools.webContents)
  //mainWindow.webContents.openDevTools({ mode: 'detach' })
=======
  devtools = new BrowserWindow()
  mainWindow.webContents.setDevToolsWebContents(devtools.webContents)
  mainWindow.webContents.openDevTools({ mode: 'detach' })
>>>>>>> refs/remotes/origin/main
  //mainWindow.webContents.openDevTools()


}
app.commandLine.appendSwitch('disable-gpu-sandbox')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () =>  {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
