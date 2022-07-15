module.exports = {
  showConfigurationPanel: (action)=>{
    $('<div/>', {'class': 'panel', 'id': 'configurationPanel', 'style': 'height:'+($(window).height()-100)+'px'}).appendTo($('body'))
    showConfigurationFields()
  },
  update: ()=>{
    this_config = getFields()
    error = ''
    if(typeof this_config.mongo_db != 'undefined'){
      if(this_config.mongo_db.host == '')
        error = 'inserthost'
      else if(this_config.mongo_db.port == '')
        error = 'insertport'
      else if(this_config.mongo_db.dbname == '')
        error = 'insertdbname'
    }
    this_config.max_clue_length = parseInt(this_config.max_clue_length)
    this_config.max_name_length = parseInt(this_config.max_name_length)
    Object.entries(this_config.board_config).forEach((item, i) => {
      this_config.board_config[item[0]] = parseInt(item[1])
    })

    if(!Number.isInteger(this_config.max_name_length))
      error = 'maxnamenotinteger'
    else if(!Number.isInteger(this_config.max_clue_length))
      error = 'maxcluenotinteger'
    else if(!Number.isInteger(this_config.board_config.max_size))
      error = 'maxsizenotinteger'
    else if(!Number.isInteger(this_config.board_config.random_rows))
      error = 'randomrowsnotinteger'
    else if(!Number.isInteger(this_config.board_config.random_cols))
      error = 'randomcolsnotinteger'
    else if(!Number.isInteger(this_config.board_config.random_easy_words))
      error = 'easywordsnotinteger'
    else if(!Number.isInteger(this_config.board_config.random_medium_words))
      error = 'mediumwordsnotinteger'
    else if(!Number.isInteger(this_config.board_config.random_hard_words))
      error = 'hardwordsnotinteger'
    else if(!Number.isInteger(this_config.board_config.random_mixed_words))
      error = 'mixedwordsnotinteger'
    else if(!Number.isInteger(this_config.board_config.mixed_max_words_level))
      error = 'mixedmaxwordsnotinteger'
    else if(typeof this_config.mongo_db != 'undefined' && this_config.mongo_db.dbuser == '' && this_config.mongo_db.dbpassword != '')
      error = 'blankuser'
    else if(typeof this_config.mongo_db != 'undefined' && this_config.mongo_db.dbuser != '' && this_config.mongo_db.dbpassword == '')
      error = 'blankpassword'

    if(error != '')
      box(datalanguage['alert'], datalanguage[error])
    else
      testPassword(this_config, (conf) => {
        send('update-systemconfig', conf, 'configupdated', () => {
          closePainels()
          updateSystemConfig()
          if(typeof this_config.mongo_db != 'undefined' &&
          typeof systemConfig.mongo_db != 'undefined' &&
          (systemConfig.mongo_db.host != this_config.mongo_db.host
           || systemConfig.mongo_db.port != this_config.mongo_db.port
           || systemConfig.mongo_db.dbname != this_config.mongo_db.dbname
           || systemConfig.mongo_db.dbuser != this_config.mongo_db.dbuser
           || systemConfig.mongo_db.dbpassword != this_config.mongo_db.dbpassword))
            $('#quitadmin').click()
          else if(typeof this_config.mongo_db == 'undefined' && typeof systemConfig.mongo_db.host != 'undefined')
            $('#quitadmin').click()
        })
      })
  }
}


function testPassword(config, callback){
  if($('#admin_password').val() || $('#admin_password2').val()){
    error = validatePassword(config.admin_password)
    if(!error && config.admin_password != config.admin_password2)
      error = 'passwordmismatch'
    if(error)
      box(datalanguage['alert'], datalanguage[error])
    else{
      delete config.admin_password2
      hash(config.admin_password, (password) => {
        config.admin_password = password
        callback(config)
      })
    }
  }else{
    delete config.admin_password
    delete config.admin_password2
      callback(config)
  }
}

function getFields(){
  this_config = {
    "language": $('#language').val(),
    "admin_password": $('#admin_password').val(),
    "admin_password2": $('#admin_password2').val(),
    "max_name_length": $('#max_name_length').val(),
    "max_clue_length": $('#max_clue_length').val(),
    "board_config": {
        "max_size": $('#max_size').val(),
        "random_rows": $('#random_rows').val(),
        "random_cols": $('#random_cols').val(),
        "random_easy_words": $('#random_easy_words').val(),
        "random_medium_words": $('#random_medium_words').val(),
        "random_hard_words": $('#random_hard_words').val(),
        "random_mixed_words": $('#random_mixed_words').val(),
        "mixed_max_words_level": $('#mixed_max_words_level').val()
      }
  }
  if($('#database').is(':checked')){
    this_config.mongo_db = {
      'host': $('#host').val(),
      'port': $('#port').val(),
      'dbname': $('#dbname').val(),
      'dbuser': $('#dbuser').val(),
      'dbpassword': $('#dbpassword').val()
    }
  }
  return this_config
}

function showConfigurationFields(){
    $('#fields').remove()
    fields = $('<div/>', {'id': 'fields'}).appendTo($('#configurationPanel'))
    $('<input/>', {'type': 'button', 'id': 'importData', 'class': 'btn btn-primary pull-right', 'style': 'margin:10px;'}).val(datalanguage['importdata']).appendTo(fields).click(function(){
      send('data-import', { 'title': datalanguage['selectfileupload'] }, 'dataimported', function(){
        updateSystemConfig()
      })
    })
    $('<input/>', {'type': 'button', 'id': 'exportData', 'class': 'btn btn-primary pull-right', 'style': 'margin:10px;'}).val(datalanguage['exportdata']).appendTo(fields).click(function(){
        send('data-export', { 'title': datalanguage['selectfileexport'] }, 'dataexported')
    })
    $('<span/>').text(datalanguage['language']+': ').appendTo(fields)
    $('<select/>', {'id': 'language'}).val(systemConfig.language).appendTo(fields)
    listLanguages($('#language'), (select)=>{
      select.val(systemConfig.language)
    })
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['adminpasswd']+': ').appendTo(fields)
    $('<input/>', {'id': 'admin_password', 'type': 'password', 'maxlenght': 20, 'title': datalanguage['blankunchange']}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['adminpasswd']+': ').appendTo(fields)
    $('<input/>', {'id': 'admin_password2', 'type': 'password', 'maxlenght': 20, 'title': datalanguage['reenterpassword']}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['maxname']+': ').appendTo(fields)
    $('<input/>', {'id': 'max_name_length', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.max_name_length}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['maxclue']+': ').appendTo(fields)
    $('<input/>', {'id': 'max_clue_length', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.max_clue_length}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['maxsize']+': ').appendTo(fields)
    $('<input/>', {'id': 'max_size', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.max_size}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['randomboard']).attr('style', 'text-transform: uppercase;font-weight: bold;').appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['randomcols']+': ').appendTo(fields)
    $('<input/>', {'id': 'random_cols', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.random_cols}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['randomrows']+': ').appendTo(fields)
    $('<input/>', {'id': 'random_rows', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.random_rows}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['easywords']+': ').appendTo(fields)
    $('<input/>', {'id': 'random_easy_words', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.random_easy_words}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['mediumwords']+': ').appendTo(fields)
    $('<input/>', {'id': 'random_medium_words', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.random_medium_words}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['hardwords']+': ').appendTo(fields)
    $('<input/>', {'id': 'random_hard_words', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.random_hard_words}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['mixedwords']+': ').appendTo(fields)
    $('<input/>', {'id': 'random_mixed_words', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.random_mixed_words}).appendTo(fields)
    $('<br>').appendTo(fields)
    $('<span/>').text(datalanguage['maxmixedwords']+': ').appendTo(fields)
    $('<input/>', {'id': 'mixed_max_words_level', 'type': 'number', 'class': 'Numbers small', 'value': systemConfig.board_config.mixed_max_words_level}).appendTo(fields)
    $('<br/>').appendTo(fields)
    $('<br/>').appendTo(fields)
    $('<span/>').text(datalanguage['database']).attr('style', 'text-transform: uppercase;font-weight: bold;').appendTo(fields)
    $('<br/>').appendTo(fields)
    $('<input/>', {'id': 'database', 'type': 'checkbox'}).appendTo(fields).change(function(){
      if(this.checked){
        if(typeof systemConfig.mongo_db != 'undefined'){
          if(typeof systemConfig.mongo_db.host != 'undefined')
            $('#host').val(systemConfig.mongo_db.host)
          if(typeof systemConfig.mongo_db.port != 'undefined')
            $('#port').val(systemConfig.mongo_db.port)
          if(typeof systemConfig.mongo_db.dbname != 'undefined')
            $('#dbname').val(systemConfig.mongo_db.dbname)
          if(typeof systemConfig.mongo_db.dbuser != 'undefined')
            $('#dbuser').val(systemConfig.mongo_db.dbuser)
          if(typeof systemConfig.mongo_db.dbpassword != 'undefined')
            $('#dbpassword').val(systemConfig.mongo_db.dbpassword)
        }
        $('#dbfields').show()
      }else{
        $('#dbfields').hide()
      }
    })
    $('<span/>').text(' '+datalanguage['enabledb']).appendTo(fields)
    $('<div/>', {'id': 'dbfields'}).hide().appendTo(fields)
    $('<span/>').text(datalanguage['host']+': ').appendTo($('#dbfields'))
    $('<input/>', {'id': 'host'}).appendTo($('#dbfields'))
    $('<br/>').appendTo($('#dbfields'))
    $('<span/>').text(datalanguage['port']+': ').appendTo($('#dbfields'))
    $('<input/>', {'id': 'port', 'class': 'Numbers small'}).appendTo($('#dbfields'))
    $('<br/>').appendTo($('#dbfields'))
    $('<span/>').text(datalanguage['dbname']+': ').appendTo($('#dbfields'))
    $('<input/>', {'id': 'dbname'}).appendTo($('#dbfields'))
    $('<br/>').appendTo($('#dbfields'))
    $('<span/>').text(datalanguage['user']+': ').appendTo($('#dbfields'))
    $('<input/>', {'id': 'dbuser'}).appendTo($('#dbfields'))
    $('<span/>').text(datalanguage['password']+': ').appendTo($('#dbfields'))
    $('<input/>', {'id': 'dbpassword', 'type': 'password'}).appendTo($('#dbfields'))
    $('#admin_password').focus()
    if(typeof systemConfig.mongo_db != 'undefined')
      if(typeof systemConfig.mongo_db.host != 'undefined' && typeof systemConfig.mongo_db.port != 'undefined' && typeof systemConfig.mongo_db.dbname != 'undefined')
        $('#database').click()
}
