const MongoClient = require('mongodb').MongoClient
const assert = require('assert')
const mongodb = require('mongodb')
const format = require('util').format

module.exports = {
  host: '',
  port: 0,
  dbname: '',
  user: '',
  password: '',
  connection: (collection, type, arg, callback, arg2)=>{
    url = 'mongodb://'
    if(module.exports.user != '' && module.exports.password == '')
      url += module.exports.user+'@'
    else if(module.exports.user != '' && module.exports.password != '')
      url += module.exports.user+':'+module.exports.password+'@'
    url += module.exports.host+':'+module.exports.port+'/'+module.exports.dbname
    MongoClient.connect(url, (err, client) => {
      if(err){
        callback(err)
        return
      }
      assert.equal(null, err)
      const db = client.db(module.exports.dbname).collection(collection)
      if(type == 'findOne'){
        if(typeof arg._id != 'undefined')
          arg._id = mongodb.ObjectId(arg._id)
        db.findOne(arg, callback)
      }
      else if(type == 'find')
        if(typeof arg2 == 'undefined')
          db.find(arg).toArray(callback)
        else{
          db.find(arg, arg2).toArray(callback)
        }
      else if(type == 'deleteOne'){
        if(typeof arg._id != 'undefined')
          arg._id = mongodb.ObjectId(arg._id)
        db.deleteOne(arg, callback)
      }else if(type == 'bulkWrite')
        db.bulkWrite(arg, callback)
      else if(type == 'aggregate')
        db.aggregate(arg).toArray(callback)
      client.close()
    })
  }
}
