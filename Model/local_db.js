const path = require('path')
const fs = require('fs')

module.exports = {
  connection: (collection, type, arg, callback, arg2)=>{
    if(typeof arg != 'object')
      console.log('Unknow string to find')
    else if(type == 'find' || type == 'findOne')
      find(collection, type, arg, callback, arg2)
    else if(type == 'aggregate')
      aggregate(collection, arg, callback)
    else if(type == 'bulkWrite')
      insertOne(collection, arg, callback)
    else if(type == 'deleteOne')
      deleteOne(collection, arg, callback)
  },
  userDataPath: ''
}

function deleteOne(collection, arg, callback){
  find(collection, 'find', {}, (err, entries)=>{
    n=0
    entries.forEach((entry, e) => {
      if(arg._id == entry._id){
        entries.splice(e, 1)
        n++
      }
    })
    this_path = path.join(module.exports.userDataPath, collection+'.json')
    fs.writeFile(this_path, JSON.stringify(entries), (err)=>{
      if (err) throw err
      callback(err, {'result': {'n': n}})
    })
  })
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 24; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function insertOne(collection, arg, callback){
  find(collection, 'find', {}, (err, entries)=>{
    insertedCount = 0
    insertedIds = []
    arg.forEach((doc, d)=>{
      exist_id = true
      while(exist_id){
        exist_id = false
        this_id = makeid(entries)
        entries.forEach((entry, e) => {
          if(entry._id == this_id)
            exist_id = true
        })
      }
      insertedIds.push(this_id)
      doc.insertOne.document._id = this_id
      entries.push(doc.insertOne.document)
      insertedCount++
    })
    this_path = path.join(module.exports.userDataPath, collection+'.json')
    fs.writeFile(this_path, JSON.stringify(entries), (err)=>{
      if (err) throw err
      callback(err, {'insertedCount': insertedCount, 'insertedIds': insertedIds})
    })
  })
}

function aggregate(collection, arg, callback){
  error = ''
  find(collection, 'find', {}, (err, col1_entries)=>{
    find(arg[0]['$lookup'].from, 'find', {}, (err2, col2_entries)=>{
      col1_entries.forEach((doc, i) => {
        col2_entries.forEach((doc2, i) => {
          localField = arg[0]['$lookup'].localField
          foreignField = arg[0]['$lookup'].foreignField
          if(typeof doc[localField] == 'undefined')
            error = 'unknow local field.'
          else if(typeof doc2[foreignField] == 'undefined')
            error = 'unknow foreign field.'
          else if(doc[localField] == doc2[foreignField]){
            doc[arg[0]['$lookup'].as] = [doc2]
          }
        })
      })
      callback(error, col1_entries)
    })
  })
}

function find(collection, type, arg, callback, arg2){
  this_path = path.join(module.exports.userDataPath, collection+'.json')
  try{
    fs.readFile(this_path, (error, data)=>{
      if(error == null){
        json = JSON.parse(data)
        entries = get_entries(json, arg, arg2)
        if(type == 'find')
          callback(error, entries)
        else if(type == 'findOne')
          callback(error, entries[0])
      }else if(error.code === 'ENOENT'){
        local_file = './db_crosswords/'+collection+'.json'
        try{
          fs.readFile(local_file, (err, data)=>{
            if(err) {
              defaults = []
            }else if (err == null)
              defaults = JSON.parse(data)
            if(!fs.lstatSync(module.exports.userDataPath).isDirectory() )
              fs.mkdir(dir, (err) => {
                if (err) throw err
                console.log('Config dir created')
              })
            fs.writeFile(this_path, JSON.stringify(defaults), (err)=>{
              if (err) throw err
              console.log('File created: '+this_path)
              entries = get_entries(defaults, arg)
              if(type == 'find')
                callback(err, entries)
              else if(type == 'findOne')
                callback(err, entries[0])
            })
          })
        }catch(error){
          console.log(error)
        }
      }
    })
  } catch(error){
    console.log(error)
  }
}

function get_entries(json, arg, arg2){
  if(Object.entries(arg).length > 0)
    Object.entries(arg).forEach((search, s) => {
      remove = []
      json.forEach((doc, d) => {
        if(search[1] != doc[search[0]])
          remove.push(d)
      })
      for(i=remove.length-1;i>=0;i--)
        json.splice(remove[i], 1)
    })
  if(typeof arg2 != 'undefined')
    if(typeof arg2.projection != 'undefined'){
      json.forEach((doc, d) => {
        mydoc = {}
        excludeid = false
        Object.entries(arg2.projection).forEach((projection, p) => {
          if(projection[0] == '_id' && projection[1] == 0)
            excludeid = true
          Object.entries(doc).forEach((field, f) => {
            if(field[0] == projection[0])
              if(projection[1] == 0)
                delete doc[field[0]]
              else if(projection[1] == 1)
                mydoc[field[0]] = field[1]
          })
        })
        if(!excludeid)
          mydoc._id = doc._id
        json[d] = mydoc
      })
    }
  return json
}
