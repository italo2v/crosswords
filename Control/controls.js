const db = require('../Model/db.js')
const randomBoard = require('./randomBoard.js')

module.exports = {
  systemConfig: {},
  getDbConfig: (callback)=>{
    this_db = db.mydb
    db.mydb = db.local_db
    db.local_db.userDataPath = module.exports.systemConfig.userDataPath
    db.local_db.appPath = module.exports.systemConfig.appPath
    db.getSystemConfig( (err, config) => {
      if (err) throw err;
      mongoconf = config[0].mongo_db
      db.mydb = this_db
      callback(mongoconf)
    })
  },
  getSystemConfig: (arg, callback) => {
    module.exports.getDbConfig( (mongoconf)=>{
      if(typeof mongoconf != "undefined"){
        if(typeof mongoconf.host != 'undefined' && typeof mongoconf.port != 'undefined' && typeof mongoconf.dbname != 'undefined'){
          db.mydb = db.mongo_db
          db.mongo_db.host = mongoconf.host
          db.mongo_db.port = mongoconf.port
          db.mongo_db.dbname = mongoconf.dbname
          db.mongo_db.dbuser = mongoconf.dbuser
          db.mongo_db.dbpassword = mongoconf.dbpassword
            db.mongo_db.connection('system', 'find', {}, (err, this_conf)=>{
              if(err != null || this_conf.length == 0)
                db.mydb = db.local_db
              db.getSystemConfig( (err, config) => {
                if (err) throw err;
                delete config[0]._id
                delete config[0].admin_password
                if(typeof mongoconf.host != 'undefined')
                  config[0].mongo_db = mongoconf
                callback(config[0])
              })
            })
        }else{
          db.mydb = db.local_db
          db.getSystemConfig( (err, config) => {
            if (err) throw err;
            delete config[0]._id
            delete config[0].admin_password
            callback(config[0])
          })
        }
      }else{
        db.mydb = db.local_db
        db.getSystemConfig( (err, config) => {
          if (err) throw err;
          delete config[0]._id
          delete config[0].admin_password
          callback(config[0])
        })
      }
    })
  },
  updateSystemConfig: (obj, callback) => {
    user = obj.myUser
    config = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }
      if(typeof config.mongo_db != 'undefined'){
        if(config.mongo_db.host == ''){
          callback('inserthost')
          return
        }
        else if(config.mongo_db.port == ''){
          callback('insertport')
          return
        }else if(config.mongo_db.dbname == ''){
          callback('insertdbname')
          return
        }
      }
      if(typeof config.admin_password != 'undefined'){
        if(config.admin_password.length != 44){
          callback('invalidpassword')
          return
        }
      }
      if(!Number.isInteger(config.max_name_length))
        callback('maxnamenotinteger')
      else if(!Number.isInteger(config.max_clue_length))
        callback('maxcluenotinteger')
      else if(!Number.isInteger(config.board_config.max_size))
        callback('maxsizenotinteger')
      else if(!Number.isInteger(config.board_config.random_rows))
        callback('randomrowsnotinteger')
      else if(!Number.isInteger(config.board_config.random_cols))
        callback('randomcolsnotinteger')
      else if(!Number.isInteger(config.board_config.random_easy_words))
        callback('easywordsnotinteger')
      else if(!Number.isInteger(config.board_config.random_medium_words))
        callback('mediumwordsnotinteger')
      else if(!Number.isInteger(config.board_config.random_hard_words))
        callback('hardwordsnotinteger')
      else if(!Number.isInteger(config.board_config.random_mixed_words))
        callback('mixedwordsnotinteger')
      else if(!Number.isInteger(config.board_config.mixed_max_words_level))
        callback('mixedmaxwordsnotinteger')
      else
        module.exports.getLanguage(config.language, (datalanguage)=>{
          config.language = datalanguage['langLocale']
          this_db = db.mydb
          db.mydb = db.local_db
          db.getSystemConfig( (err, conf) => {
            if (err) throw err;
            conf_local = conf[0]
            if(typeof config.mongo_db == 'undefined')
              config.mongo_db = {}
            mongoconf = config.mongo_db
            if(typeof mongoconf.host != 'undefined' && typeof mongoconf.port != 'undefined' && typeof mongoconf.dbname != 'undefined' &&  typeof mongoconf.dbuser != 'undefined' &&  typeof mongoconf.dbpassword != 'undefined'){
              db.mydb = db.mongo_db
              db.mongo_db.host = mongoconf.host
              db.mongo_db.port = mongoconf.port
              db.mongo_db.dbname = mongoconf.dbname
              db.mongo_db.dbuser = mongoconf.dbuser
              db.mongo_db.dbpassword = mongoconf.dbpassword
              try{
                db.mongo_db.connection('system', 'find', {}, (err, test)=>{
                  db.mydb = db.local_db
                  if(err != null || test.length == 0){
                    module.exports.getSystemConfig('', (conf)=>{ //reset db config
                      callback('incorrectdb')
                    })
                  }else{
                    if(typeof conf_local.mongo_db != 'undefined'
                     && conf_local.mongo_db.host == mongoconf.host
                     && conf_local.mongo_db.port == mongoconf.port
                     && conf_local.mongo_db.dbname == mongoconf.dbname
                     && conf_local.mongo_db.dbuser == mongoconf.dbuser
                     && conf_local.mongo_db.dbpassword == mongoconf.dbpassword){
                      db.mydb = db.mongo_db
                      delete config.mongo_db
                      db.getSystemConfig( (err, conf_mongo) => { //update system at mongo_db
                          if (err) throw err
                          if(typeof config.admin_password == 'undefined')
                            config.admin_password = conf_mongo[0].admin_password
                          db.registerSystemConfig(config, (err, res) => {
                            if(res.insertedCount == 1){
                              db.deleteSystemConfig(conf_mongo[0]._id.toString(), (err, result) => {
                                if (err) throw err;
                                if(result.result.n == 1)
                                  callback('configupdated')
                                else
                                  module.exports.getSystemConfig('', (conf)=>{ //reset db config
                                    callback('oldconfigundeleted')
                                  })
                              })
                            }else
                              module.exports.getSystemConfig('', (conf)=>{ //reset db config
                                callback('confignotupdated')
                              })
                          })
                      })
                    }else{
                      conf_local.mongo_db = mongoconf
                      db.mydb = db.local_db
                      db.registerSystemConfig(conf_local, (err, res) => { //update only mongoconf at local_db
                        if(res.insertedCount == 1){
                          db.deleteSystemConfig(conf_local._id.toString(), (err, result) => {
                             if (err) throw err;
                             if(result.result.n == 1)
                              callback('configupdated')
                             else
                              callback('oldconfigundeleted')
                          })
                        }else
                          callback('confignotupdated')
                      })
                    }
                  }
                })
              }catch(error){
                console.log(error)
              }
            }else{
              db.mydb = db.local_db
              if(typeof config.admin_password == 'undefined')
                config.admin_password = conf_local.admin_password
              db.registerSystemConfig(config, (err, res) => { //update system at local_db
                if(res.insertedCount == 1){
                  db.deleteSystemConfig(conf_local._id.toString(), (err, result) => {
                     if (err) throw err;
                     if(result.result.n == 1)
                      callback('configupdated')
                     else
                      callback('oldconfigundeleted')
                  })
                }else
                  callback('confignotupdated')
              })
            }
          })
        })
    })
  },
  importData: (obj, callback) =>{
    user = obj.myUser
    data = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd)
        callback('invaliduser')
      else{
        if(data.length == 0){
          callback('invalidfile')
          return
        }
        else if(typeof data[0] != 'object'){
          callback('invalidfile')
          return
        }
        else if(typeof data[0].system == 'undefined' || typeof data[0].boards == 'undefined' || typeof data[0].classes == 'undefined' || typeof data[0].dictionaries == 'undefined'){
          callback('invalidfile')
          return
        }
        items = ['language', 'max_name_length', 'max_clue_length']
        board_config_items = ['max_size', 'random_rows', 'random_cols', 'random_easy_words', 'random_medium_words', 'random_hard_words', 'random_mixed_words', 'mixed_max_words_level']
        module.exports.getSystemConfig('', (config)=>{
          items.forEach((item, i) => {
            if(typeof data[0].system[0][item] != 'undefined')
              config[item] = data[0].system[0][item]
          })
          if(typeof data[0].system[0].board_config != 'undefined')
            board_config_items.forEach((item, i) => {
              if(typeof data[0].system[0].board_config[item] != 'undefined')
                config.board_config[item] = data[0].system[0].board_config[item]
            })
          module.exports.updateSystemConfig({'myUser': user, 'arg': config}, (result)=>{
            config.userDataPath = module.exports.systemConfig.userDataPath
            if(result != 'configupdated')
              callback(result)
            else{
              module.exports.systemConfig = config
              importObjects(data, (result)=>{
                callback(result)
              })
            }
          })
        })
      }
    })
  },
  exportData: (obj, callback) =>{
    user = obj.myUser
    arg = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd)
        callback('invaliduser')
      else{
        data = [
          {"system": [], "boards": [], "classes": [], "dictionaries": []}
        ]
        db.getSystemConfig( (err, config)=>{
          if(err) throw err
          data[0].system = config
          module.exports.getDbConfig( (mongoconf)=>{
            data[0].system[0].mongo_db = mongoconf
            db.exportData( (exported)=>{
              data[0].boards = exported.boards
              data[0].classes = exported.classes
              data[0].dictionaries = exported.dictionaries
              callback(data)
            })
          })
        })
      }
    })
  },
  changeAdminPassword: (obj, callback) =>{
    user = obj.myUser
    arg = obj.arg
    module.exports.getAdminPassword('', (adminpassword)=>{
      if(adminpassword != arg.currentpassword && arg.currentpassword != 'kKK+M4olFe+kY95unlU6X1JgZNMN6iQ8mcs6IffoTf8=')
        callback('wrongadminpassword')
      else if(typeof arg.admin_password == 'undefined' || arg.admin_password.length != 44)
        callback('invalidpassword')
      else{
        delete arg.currentpassword
        db.getSystemConfig( (error, conf)=>{
          db.registerSystemConfig(arg, (err, res) => {
            if(res.insertedCount == 1){
              db.deleteSystemConfig(conf[0]._id, (err, result) => {
                 if (err) throw err;
                 if(result.result.n == 1)
                  callback('configupdated')
                 else
                  callback('oldconfigundeleted')
              })
            }else
              callback('confignotupdated')
          })
        })
      }
    })
  },
  getAdminPassword: (obj, callback)=>{
    db.getSystemConfig( (err, config) => {
      if (err) throw err;
      callback(config[0].admin_password)
    })
  },
  loadBoard: (obj, callback) => {
    module.exports.getBoard(obj, (board) => {
       board = hideLetters(board)
       callback(board)
    })
  },
  getBoard: (obj, callback) => {
    db.getBoard(obj.name, obj.locale, (err, board) => {
       if (err) throw err;
       if(board){
         board.id = board._id.toString()
         callback(board)
       }else
         callback(false)
    })
  },
  registerBoard: (obj, callback) => {
    user = obj.myUser
    board = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }
      else if(board.name == ''){
        callback('insertboardname')
        return
      }
      else if(board.name.length > module.exports.systemConfig.max_name_length){
        callback('largename')
        return
      }else
      module.exports.getBoard({"name": board.name, "locale": board.locale}, (this_board) => {
        if(this_board && this_board.id != board.id){
            callback('boardnameexists')
            return
        }else{
          if(board.class == ''){
            callback('selectclass')
            return
          }
          max_size = module.exports.systemConfig.board_config.max_size
          max_clue_length = module.exports.systemConfig.max_clue_length
          test = false
          if(board.width > max_size){
            test = 'widthexceed'
          }
          else if(board.height > max_size){
            test = 'heightexceed'
          }
          if(!test)
            for(i=0;i<2;i++){
              if(i==0)
                type = board.across
              else if(i==1)
                type = board.down
              type.forEach((word, i) => {
                if(word.word == ''){
                  test = 'blankword'
                  return
                }else if(word.word.length > max_size){
                  test = 'largeword'
                  return
                }else if(word.text == ''){
                  test = 'blankclue'
                  return
                }else if(word.text.length > max_clue_length){
                  test = 'largeclue'
                  return
                }
              })
            }
          if(test){
            callback(test)
            return
          }
          db.registerBoard(board, (err, res) => {
            if (err) throw err;
            if(res.insertedCount == 1)
              callback('boardregistered')
            else
              callback('boardunregistered')
          })
        }
      })
    })
  },
  deleteBoard: (obj, callback) => {
    user = obj.myUser
    id = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }else
      db.deleteBoard(id, (err, res) => {
         if (err) throw err;
         if(res.result.n == 1)
          callback('boarddeleted')
         else
          callback('boardundeleted')
      })
    })
  },
  updateBoard: (obj, callback) => {
    user = obj.myUser
    board = obj.arg
    if(typeof board.oldname != 'undefined'){
      module.exports.registerBoard(obj, (result) => {
        if(result == 'boardregistered'){
          module.exports.deleteBoard({'myUser': user, 'arg': board.id}, (result) => {
            if(result == 'boardundeleted')
              callback('boardundeleted')
          })
          callback('boardupdated')
        }else
          callback(result)
      })
    }else{
      callback('selectboard')
    }
  },
  listBoards: (arg, callback) => {
      if(arg.class != undefined){
        classe = arg.class
        locale = arg.locale
      }else{
        locale = arg
        classe = ''
      }
      db.listBoards(locale, classe, (err, boards) => {
         if (err) throw err;
         boards.forEach( (element) => {
           element.id = element._id.toString()
         })
         callback(boards)
      })
  },
  registerClass: (obj, callback) => {
    user = obj.myUser
    classe = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }
      else if(classe.name == ''){
        callback('insertclassname')
        return
      }
      else if(classe.name.length > module.exports.systemConfig.max_name_length){
        callback('largename')
        return
      }else
      module.exports.getClass({"name": classe.name, "parent": classe.parent, "locale": classe.locale}, (this_classe) => {
        if(this_classe){
          callback('classnameexists')
          return
        }else{
          db.registerClass(classe, (err, res) => {
            if (err) throw err;
            if(res.insertedCount == 1){
              callback('classregistered')
              return
            }else
              callback('classunregistered')
          })
        }
      })
    })
  },
  deleteClass: (obj, callback) => {
    user = obj.myUser
    arg = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }
      else if(arg.class == ''){
        callback('selectclass')
        return
      }else
        module.exports.listClasses({"parent": arg.class, "locale": arg.locale}, (classes) => {
          if(classes.length > 0)
            callback('subclassexists')
          else
            module.exports.listBoards({"class": arg.class, "locale": arg.locale}, (boards) => {
              if(boards.length > 0)
                callback('boardclassexsists')
              else
                module.exports.listDictionaries(arg.class, (dictionaries) => {
                  if(dictionaries.length > 0)
                    callback('dictionaryclassexists')
                  else
                    db.deleteClass(arg.class, (err, res) => {
                      if (err) throw err;
                      if(res.result.n == 1)
                        callback('classdeleted')
                      else
                        callback('classundeleted')
                    })
                })
            })
        })
    })
  },
  getClass: (obj, callback) => {
    db.getClass(obj.name, obj.parent, obj.locale, (err, classes) => {
      if (err) throw err;
      exist = false
      if(classes != null)
        classes.forEach((classe, i) => {
          if(classe.parent == obj.parent){
            callback(classe)
            exist = true
            return
          }
        })
      if(!exist)
        callback(false)
    })
  },
  listClasses: (arg, callback) => {
      if(arg.parent != undefined){
        parent = arg.parent
        locale = arg.locale
      }else{
        locale = arg
        parent = ''
      }
    db.listClasses(locale, parent, (err, classes) => {
       if (err) throw err;
       classes.forEach( (element) => {
         element.id = element._id.toString()
       })
       callback(classes)
    })
  },
  listLanguages: (arg, callback) => {
    db.listLanguages( (err, languages) => {
       if (err) throw err;
       callback(languages)
    })
  },
  getLanguage: (lang, callback) => {
    db.getLanguage(lang, (err, language) => {
      if (err) throw err;
      if(language != null){
        datalanguage = language['text']
        datalanguage['langLocale'] = language.language
        callback(datalanguage)
      }else
        module.exports.getLanguageSystem( (datalanguage) => {
          callback(datalanguage)
        })
    })
  },
  getLanguageSystem: (callback) => {
    db.getLanguageSystem( (err, config) => {
      if (err) throw err;
      config = config[0]
      datalanguage = config.datalanguage[0].text
      datalanguage['langLocale'] = config.datalanguage[0].language
      callback(datalanguage) //load language
    })
  },
  registerDictionary: (obj, callback) => {
    user = obj.myUser
    dictionary = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }
      else if(dictionary.name == ''){
        callback('insertdictionaryname')
        return
      }
      else if(dictionary.name.length > module.exports.systemConfig.max_name_length){
        callback('largename')
        return
      }else if(dictionary.class == ''){
          callback('selectclass')
          return
      }else
      module.exports.getDictionary({"name": dictionary.name, "class": dictionary.class}, (this_dictionary) => {
        if(this_dictionary && dictionary.id != this_dictionary.id){
          callback('dictionaryexists')
          return
        }else{
          test = ''
          dictionary.words.forEach((word, i) => {
            if(word.word == ''){
              test = 'blankword'
              return
            }else if(word.word.length > module.exports.systemConfig.board_config.max_size){
              test = 'largeword'
              return
            }else if(word.text == ''){
              test = 'blankclue'
              return
            }else if(word.text.length > module.exports.systemConfig.max_clue_length){
              test = 'largeclue'
              return
            }
            if(typeof word.number != 'undefined')
              delete word.number
          })
          if(test != '')
            callback(test)
          else
            db.registerDictionary(dictionary, (err, res) => {
              if (err) throw err;
              if(res.insertedCount == 1){
                callback('dictionaryregistered')
                return
              }else
                callback('dictionaryunregistered')
            })
        }
      })
    })
  },
  updateDictionary: (obj, callback) => {
    user = obj.myUser
    dictionary = obj.arg
    if(typeof dictionary.oldname != 'undefined'){
      module.exports.registerDictionary(obj, (result) => {
        if(result == 'dictionaryregistered'){
          module.exports.deleteDictionary({'myUser': user, 'arg': dictionary.id}, (result) => {
            if(result == 'dictionaryundeleted')
              callback(result)
            else
              callback('dictionaryupdated')
          })
        }else
          callback(result)
      })
    }else{
      callback('selectdictionary')
    }
  },
  deleteDictionary: (obj, callback) => {
    user = obj.myUser
    id = obj.arg
    module.exports.getAdminPassword('', (passwd)=>{
      if(typeof user == 'undefined' || user.login != 'admin' || user.password != passwd){
        callback('invaliduser')
        return
      }
      else if(id == ''){
        callback('selectdictionary')
        return
      }else
        db.deleteDictionary(id, (err, res) => {
          if (err) throw err;
          if(res.result.n == 1)
            callback('dictionarydeleted')
          else
            callback('dictionaryundeleted')
        })
    })
  },
  getDictionaries: (classe, callback) => {
    db.getDictionaries(classe, (err, dictionaries) => {
       if (err) throw err;
       dictionaries.forEach( (element) => {
         element.id = element._id.toString()
       })
       callback(dictionaries)
    })
  },
  listDictionaries: (classe, callback) => {
    db.listDictionaries(classe, (err, dictionaries) => {
       if (err) throw err;
       dictionaries.forEach( (element) => {
         element.id = element._id.toString()
       })
       callback(dictionaries)
    })
  },
  getDictionary: (obj, callback) => {
    db.getDictionary(obj.name, obj.class, (err, dictionary) => {
       if (err) throw err;
       if(dictionary)
         dictionary.id = dictionary._id.toString()
       callback(dictionary)
    })
  },
  generateRandomBoard: (conf, callback) => {
    module.exports.getDictionaries(conf.class, (dictionaries) => {
      dictionary = []
      dictionaries.forEach( (item) => {
        item.words.forEach( (word) => {
            word.word = word.word.toUpperCase()
            dictionary.push(word)
        })
      })

      board = randomBoard.generate(dictionary, conf.level, module.exports.systemConfig.board_config)
      board.class = conf.class
      if(board.across.length == 0 || board.down.length == 0)
        callback('insuficientwords')
      else
        db.registerRandomBoard(board, (err, res) => {
          if (err) throw err;
          if(res.insertedCount == 1){
            board.id = res.insertedIds[0].toString()
            board = hideLetters(board)
            board.total = board.across.length+board.down.length
            callback(board)
          }else
            callback('generatingboarderror')
        })
    })
  },
  getRandomBoard: (id, callback) => {
      if(id.length != 24){
        callback('invalidid')
        return
      }
      db.getRandomBoard(id, (err, board) => {
         if (err) throw err;
         board.id = board._id.toString()
         callback(board)
      })
  },
  evaluateBoard: (obj, callback) => {
      board = obj.board
      if(typeof obj.evaluation.tries != "undefined")
        evaluation = obj.evaluation
      else
        evaluation = ''
      if(board.name == '#random#')
        module.exports.getRandomBoard(board.id, (dbBoard)=>{
          evaluateWords(evaluation, dbBoard, (result)=>{
            callback(result)
          })
        })
      else
        module.exports.getBoard({"name": board.name, "locale": board.locale}, (dbBoard)=>{
          evaluateWords(evaluation, dbBoard, (result)=>{
            callback(result)
          })
        })
  }
}

async function importObjects(data, callback){
    data = await new Promise( async(getData)=>{
      for(ci=0;ci<data[0].classes.length;ci++){
        class_import = data[0].classes[ci]
        new_id = await tryImportObj('class', {'name': class_import.name, 'parent': class_import.parent, 'locale': class_import.locale})
        if(new_id){
          data[0].classes.forEach((classe, c) => {
            if(classe.parent == class_import._id.toString())
              classe.parent = new_id
          })
          data[0].boards.forEach((board, b) => {
            if(board.class == class_import._id.toString())
              board.class = new_id
          })
          data[0].dictionaries.forEach((dictionary, d) => {
            if(dictionary.class == class_import._id.toString())
              dictionary.class = new_id
          })
        }else
          callback('importclasserror')
      }
      getData(data)
    })
    for(tb=0;tb<data[0].boards.length;tb++){
      this_board = data[0].boards[tb]
      delete this_board._id
      this_id = await tryImportObj('board', this_board)
      if(!this_id)
        callback('importboarderror')
    }
    for(td=0;td<data[0].dictionaries.length;td++){
      this_dictionary = data[0].dictionaries[td]
      delete this_dictionary._id
      this_id = await tryImportObj('dictionary', this_dictionary)
      if(!this_id)
        callback('importdictionaryerror')
    }
  callback('dataimported')
}

async function tryImportObj(type, obj){
  abort = false
  n=0
  this_name = obj.name
  if(type == 'class'){
    myCheckFunction = module.exports.getClass
    myDbFunction = db.registerClass
  }else if(type == 'board'){
    myCheckFunction = module.exports.getBoard
    myDbFunction = db.registerBoard
  }else if(type == 'dictionary'){
    myCheckFunction = module.exports.getDictionary
    myDbFunction = db.registerDictionary
  }
  while(!abort){
    name = await new Promise((resolve)=>{
      myCheckFunction(obj, (this_classe) => {
        n++
        if(this_classe){
          obj.name = this_name+n
          resolve(obj.name)
        }else{
          resolve(obj.name)
          abort = true
        }
      })
    })
  }
  obj.name = name
  id = await new Promise((getId)=>{
    myDbFunction(obj, (err, result)=>{
      if(err) throw err
      if(result.insertedCount == 1){
        getId(result.insertedIds[0].toString())
      }else
        getId(null)
    })
  })
  return id
}

function hideLetters(board){
  for(t=0;t<=1;t++){
    if(t == 0)
      type = board.across
    else if(t == 1)
      type = board.down
    for(w=0;w<type.length;w++){
      for(i=0;i<type[w].word.length;i++)
        if(type[w].word[i] != ' ' && type[w].word[i] != '-')
          type[w].word = type[w].word.substring(0, i) + '*' + type[w].word.substring(i + 1)
    }
  }
  return board
}

function evaluateWords(evaluation, dbBoard, callback){

    correct = 0
    if(evaluation == ''){
      tries = 0
      correct_words = []
      score = 0
    }else{
      tries = evaluation.tries
      correct_words = evaluation.correct_words
      score = evaluation.score
    }
    board.words.forEach( (word)=>{
      if(correct_words.indexOf(word.number) == -1){
        dbBoard.across.forEach( (word_db) => {
          if(word_db.number == word.number)
            if(evaluateWord(word, word_db)){
              correct++
              correct_words.push(word.number)
            }
        })
        dbBoard.down.forEach( (word_db) => {
          if(word_db.number == word.number)
            if(evaluateWord(word, word_db)){
              correct++
              correct_words.push(word.number)
            }
        })
      }
    })
    total = dbBoard.across.length+dbBoard.down.length
    tries++
    score += correct/total*10/tries //each evaluation word points decrease half
    score = parseFloat(score.toFixed(2))
    evaluation = {
     "score": score,
     "tries": tries,
     "correct_words": correct_words
    }
    if(score == 10)
      callback(['congratulations', evaluation])
    else
      callback(['tryagain', evaluation])
}

function evaluateWord(word, word_db){
    //replacing special letters
    special_letters = "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝŔÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŕ";
    normal_letters = "AAAAAAACEEEEIIIIDNOOOOOOUUUUYRsBaaaaaaaceeeeiiiionoooooouuuuybyr";
    for(l=0;l<special_letters.length;l++){
      word_db.word = word_db.word.replace(special_letters[l], normal_letters[l])
    }
    if(word.word.toUpperCase() == word_db.word.toUpperCase()){
      return true
    }
    return false
}
