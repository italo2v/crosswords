const mongodb = require('./mongo_db.js')
const localdb = require('./local_db.js')

module.exports = {
  mongo_db: mongodb,
  local_db: localdb,
  mydb: localdb,
  listLanguages : (callback) => {
    module.exports.mydb.connection('languages', 'find', {}, callback, { projection: { _id: 0, name: 1, language: 1, picture: 1 } })
  },
  getLanguage: (language, callback) => {
    module.exports.mydb.connection('languages', 'findOne', {'language': language}, callback)
  },
  getLanguageSystem : (callback) => {
    module.exports.mydb.connection('system', 'aggregate', [
         {
           $lookup:
             {
               from: "languages",
               localField: "language",
               foreignField: "language",
               as: "datalanguage"
             }
        }
      ], callback)
  },
  getSystemConfig : (callback) => {
    module.exports.mydb.connection('system', 'find', {}, callback)
  },
  registerSystemConfig : (config, callback) => {
    if(typeof config.mongo_db != "undefined")
      config_db = config.mongo_db
    else
      config_db = {}
    module.exports.mydb.connection('system', 'bulkWrite', [
      {
        insertOne: {
          document: {
            "multiplayer": false,
            "max_time": false,
            "orthography": false,
            "rewards": false,
            "each_word": false,
            "language": config.language,
            "admin_password": config.admin_password,
            "board_config": config.board_config,
            "max_name_length": config.max_name_length,
            "max_clue_length": config.max_clue_length,
            "mongo_db": config_db
          }
        }
      }], callback)
  },
  deleteSystemConfig : (id, callback) => {
    module.exports.mydb.connection('system', 'deleteOne', {"_id": id}, callback)
  },
  exportData : (callback) => {
    module.exports.mydb.connection('boards', 'find', {}, (err, boards)=>{
      if(err) throw err
      module.exports.mydb.connection('classes', 'find', {}, (err2, classes)=>{
        if(err2) throw err2
        module.exports.mydb.connection('dictionaries', 'find', {}, (err3, dictionaries)=>{
          if(err3) throw err3
          callback({'boards': boards, 'classes': classes, 'dictionaries': dictionaries})
        })
      })
    })
  },
  getBoard : (name, locale,  callback) => {
    module.exports.mydb.connection('boards', 'findOne', {"name": name, "locale": locale}, callback)
  },
  getRandomBoard : (id,  callback) => {
    module.exports.mydb.connection('randomBoards', 'findOne', {"_id": id}, callback)
  },
  listBoards : (locale, classe, callback) => {
    if(classe == '')
      find = {"locale": locale}
    else
      find = {"locale": locale, "class": classe}
    module.exports.mydb.connection('boards', 'find', find, callback, { projection: { name: 1 } })
  },
  deleteBoard : (id, callback) => {
    module.exports.mydb.connection('boards', 'deleteOne', {"_id": id}, callback)
  },
  registerBoard : (board, callback) => {
    module.exports.mydb.connection('boards', 'bulkWrite', [
      {
        insertOne: {
          document: {
            'name': board.name,
            'class': board.class,
            'width': board.width,
            'height': board.height,
            'locale': board.locale,
            'across': board.across,
            'down': board.down
          }
        }
      }], callback)
  },
  registerRandomBoard : (board, callback) => {
    module.exports.mydb.connection('randomBoards', 'bulkWrite', [
      {
        insertOne: {
          document: {
            'name': board.name,
            'class': board.class,
            'level': board.level,
            'width': board.width,
            'height': board.height,
            'locale': board.locale,
            'across': board.across,
            'down': board.down
          }
        }
      }], callback)
  },
  registerSavedBoard: (board, callback) =>{
    module.exports.mydb.connection('savedBoards', 'bulkWrite', [
      {
        insertOne: {
          document: {
            'board_id': board.board_id,
            'locale': board.locale,
            'name': board.name,
            'words': board.words,
            'evaluation': board.evaluation
          }
        }
      }], callback)
  },
  deleteSavedBoard : (id, callback) => {
    module.exports.mydb.connection('savedBoards', 'deleteOne', {"_id": id}, callback)
  },
  getSavedBoards : (callback) => {
    module.exports.mydb.connection('savedBoards', 'find', {}, callback)
  },
  getClass : (name, parent, locale, callback) => {
    module.exports.mydb.connection('classes', 'find', {"name": name, "parent": parent, "locale": locale}, callback)
  },
  listClasses : (locale, parent, callback) => {
    if(parent != '')
      find = {"locale": locale, "parent": parent}
    else
      find = {"locale": locale}
    module.exports.mydb.connection('classes', 'find', find, callback, { projection: { name: 1, parent: 1 } })
  },
  deleteClass : (id, callback) => {
    module.exports.mydb.connection('classes', 'deleteOne', {"_id": id}, callback)
  },
  registerClass : (classe, callback) => {
    module.exports.mydb.connection('classes', 'bulkWrite', [
      {
        insertOne: {
          document: {
            'name': classe.name,
            'parent': classe.parent,
            'locale': classe.locale
          }
        }
      }], callback)
  },
  getDictionaries : (classe, callback) => {
    module.exports.mydb.connection('dictionaries', 'find', {"class": classe}, callback)
  },
  getDictionary : (name, classe, callback) => {
    module.exports.mydb.connection('dictionaries', 'findOne', {"name": name, "class": classe}, callback)
  },
  listDictionaries : (classe, callback) => {
    module.exports.mydb.connection('dictionaries', 'find', {"class": classe}, callback, { projection: { name: 1 } })
  },
  registerDictionary : (dictionary, callback) => {
    module.exports.mydb.connection('dictionaries', 'bulkWrite', [
      {
        insertOne: {
          document: {
            'name': dictionary.name,
            'class': dictionary.class,
            'words': dictionary.words
          }
        }
      }], callback)
  },
  deleteDictionary : (id, callback) => {
    module.exports.mydb.connection('dictionaries', 'deleteOne', {"_id": id}, callback)
  }

};
