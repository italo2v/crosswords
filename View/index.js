// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { ipcRenderer, remote, shell } = require( "electron" )
const boardPanel = require('./boardPanel.js')
const classPanel = require('./classPanel.js')
const dictionaryPanel = require('./dictionaryPanel.js')
const configurationPanel = require('./configurationPanel.js')
var datalanguage
var close
var myUser={}
var systemConfig
var version = '1.0.2'

window.onload = () => {

  selected_menu = 0
  createMenu()

  ipcRenderer.on('change-language', (event, lang) => {
    closePainels()
    if(typeof lang != 'undefined')
      datalanguage = lang
    defaultMenu()
    translate()
    updateSystemConfig()
  })

  ipcRenderer.once('change-adminpassword', (event) =>{
    boxAdminPassword()
  })

  $(window).resize( () => { //updating box and panel size when resizing window
    height = ($(window).height()-100)
    $('#boardPanel').attr('style', 'height:'+height+'px')
    $('#classPanel').attr('style', 'height:'+height+'px')
    boxSize()
    clueSize()
  })

  // creating shortcut keys
  $(document).keydown(function(){
      key = event.keyCode || event.charCode;
      if(key == 27){ //escape
        $('ul.dropdown-menu').mouseout() //close menu
        $('ul.dropdown-menu li').each(function(){ //unselect menu
          $(this).attr('style', '')
        })
        selected_menu = 0
        if($('#box').html()){ //close box
          if($('#box .title').text() == datalanguage['about'])
            $('#box .title input').click()
          $('#box input:button').each(function(){
            if($(this).val() == 'X')
              $(this).click()
            else if($(this).val() == 'OK')
              $(this).click()
          })
        }else if($('#boxProfile').html()) //close profile
          $('#closeBox').click()
        else if($('#classPanel').html()){ //close class
          if($('#parent').html())
            $('#cancel').click()
          else
            $('#close').click()
        }else if($('#boardPanel').html() || $('#dictionaryPanel').html() || $('#configurationPanel').html()){ //close board/dictionary
          if($('#fields').html())
            $('#cancel').click()
          else
            $('#close').click()
        }else if($('#crosswords').html()) //ask close game
          $('#close').click()
      }else if(key == 13){ //enter
        $('#box input:button').each(function(){ //close box and confirm
          if($(this).val() == datalanguage['yes'])
            $(this).click()
        })
        if(selected_menu != 0)
          $('ul.dropdown-menu li').each(function(){
            if($(this).attr('style') == 'background-color:gray'){
              $(this).children('a').click()
              $(this).attr('style', '')
              event.preventDefault();
            }
          })
      }else if(event.ctrlKey && key == 81){ // ctrl+q
        if($('#crosswords').html() || $('#fields').html() || $('#classPanel').html()) //ask quit
          box(datalanguage['confirm'], datalanguage['askquit'], () => {
            $('#quit').click()
          })
        else
          $('#quit').click()
      }else if(event.ctrlKey && key == 65){ // ctrl+a open about
        event.preventDefault();
        $('#about').click()
      }else if(event.ctrlKey && key == 85){ // ctrl+u user menu
        $('#userMenu').mouseover()
      }else if(event.ctrlKey && key == 76){ // ctrl+l language menu
        if(typeof myUser.email == 'undefined')
          $('#systemLanguage').mouseover()
      }else if(event.ctrlKey && key == 69){ // ctrl+e login user or evaluate
        if(typeof myUser.email == 'undefined')
          $('#login').click()
        else if($('#Function').html() == 'play')
          $('#evaluate').click()
      }else if(event.ctrlKey && key == 82){ // ctrl+r register user
        if(typeof myUser.email == 'undefined')
          $('#registerUser').click()
      }else if(event.ctrlKey && key == 83){ // ctrl+s submit (register/update/remove)
        if($('#register').attr('style') == '')
          $('#register').click()
        else if($('#update').attr('style') == '')
          $('#update').click()
        else if($('#remove').attr('style') == '')
          $('#remove').click()
      }else if(key == 40 || key == 38){
        navigations = ['btnClasses', 'btnBoards', 'btnDictionaries', 'systemLanguage', 'userMenu']
        navigations.forEach( (nav)=>{
          navigationMenu(nav)
        })
      }else if(!$('#classPanel').html() && !$('#boardPanel').html() && !$('#dictionaryPanel').html() && !$('#crosswords').html()){
        if(event.ctrlKey && key == 80) // ctrl+p play
            $('#play').click()
        else if(event.ctrlKey && key == 75) // ctrl+k configuration
            $('#configuration').click()
        else if(event.ctrlKey && key == 66) // ctrl+b board menu
            $('#btnBoards').mouseover()
        else if(event.ctrlKey && key == 67) // ctrl+c class menu
            $('#btnClasses').mouseover()
        else if(event.ctrlKey && key == 68) // ctrl+d dictionary menu
            $('#btnDictionaries').mouseover()
      }
      //alert(key)
  })

}

function updateSystemConfig(){
  ipcRenderer.send('get-systemconfig', '')
  ipcRenderer.once('get-systemconfig', (event, config) => {
    systemConfig = config
    Object.keys(datalanguage).forEach( (item) => {
      datalanguage[item] = datalanguage[item].replace('{max_size}', systemConfig.board_config.max_size)
      datalanguage[item] = datalanguage[item].replace('{max_name_length}', systemConfig.max_name_length)
      datalanguage[item] = datalanguage[item].replace('{max_clue_length}', systemConfig.max_clue_length)
    })
  })
}

function navigationMenu(menu){
    if($('#'+menu+' a').attr('aria-expanded') == 'true'){
      last_menu = $('#'+menu+' ul li').length
      if(key == 40 && selected_menu < last_menu) //down
        selected_menu++
      else if(key == 38 && selected_menu > 1) // up
        selected_menu--
      $('#'+menu+' ul li').each(function(i, item){
        if(selected_menu-1 == i)
          $(this).attr('style', 'background-color:gray')
        else
          $(this).attr('style', '')
      })
    }
}

function send(name, arg, ok, otherFn){
  ipcRenderer.send(name, {'myUser': myUser, 'arg': arg})
  ipcRenderer.once(name, (event, result) => {
    box(datalanguage['alert'], datalanguage[result])
    if(result == ok){
      closePainels()
      if(typeof otherFn != 'undefined')
        otherFn()
    }
  })
}

//replaces all language text
function translate(){
    $("[data-translate]").each(function(){
    var key = $(this).data('translate')
    if($(this).is('input'))
      $(this).attr('value', datalanguage[key])
    else
      $(this).html(datalanguage[key] || "N/A")
    });
}

function setMask(){
    $('input.lettersBoard').on('input', function() {
        $(this).val( $(this).val().replace(/[^a-záàâãéèêíïóôõöúçñ]+$/i,'') );
    })
    $('input.letters').on('input', function() {
        $(this).val( $(this).val().replace(/[^a-záàâãéèêíïóôõöúçñ -]+$/i,'') );
    })
    $('input.lettersAndNumbers').on('input', function() {
        $(this).val( $(this).val().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ -]+$/i,'') );
    })
    $('input.Numbers').on('input', function() {
        $(this).val( $(this).val().replace(/[^0-9]/g,'') );
    })
}

function buf2Base64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}

async function hash(inputString, callback) {
    inputBytes = new TextEncoder().encode(inputString);
    hashBytes = await window.crypto.subtle.digest("SHA-256", inputBytes);
    callback(buf2Base64(hashBytes))
}

function validatePassword(p) {
  if (p.length < 6)
    return 'password6caracter'
  if (p.search(/[a-z]/i) < 0)
    return 'password1letter'
  if (p.search(/[0-9]/) < 0)
    return 'password1number'
  return false
}

function box(title, message, yesFunction){
  $('#box').remove()
  //lock the system
  if(title != datalanguage['alert']){
    $('<div>', {'id': 'lock'}).appendTo($('body'))
  }
  $('<div/>', {'class': 'box panel', 'id': 'box'}).appendTo($('body'))
  $('<div/>', {'class': 'title', 'style': 'margin:0px;'}).text(title).appendTo($('#box'))
  $('<input/>', {'type': 'button', 'class': 'pull-right'}).val('X').appendTo($('#box .title')).click(function(){
    $('#box').remove()
    if(title != datalanguage['alert'])
      $('#lock').remove()
  })
  $('<div/>', {'class': 'message'}).html(message).appendTo($('#box'))
  if(title == datalanguage['alert'] || title == datalanguage['evaluation']){
    $('<br/>').appendTo($('#box .message'))
    $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': 'ENTER'}).val('OK').appendTo($('#box .message')).click(function(){
      $('#box').remove()
      if(title != datalanguage['alert'])
        $('#lock').remove()
    })
  }
  if(title == datalanguage['confirm']){
    $('<br/>').appendTo($('#box .message'))
    $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': 'ENTER'}).val(datalanguage['yes']).appendTo($('#box .message')).click(function(){
      $('#box').remove()
      $('#lock').remove()
      yesFunction()
    })
    $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': 'ESC'}).val(datalanguage['cancel']).appendTo($('#box .message')).click(function(){
      $('#box').remove()
      $('#lock').remove()
    })
  }
  if(title == datalanguage['profile'] || title == datalanguage['level'] || title == datalanguage['system']){
    $('#box').attr('style', 'height:300px;width:250px;')
  }
  $('#box .title, #box .message').attr('style', 'padding:2px;width:'+$('#box').width()+'px;')
  boxSize()
  clearTimeout(close)
  if(title == datalanguage['alert'])
    close = setTimeout( () => {
      $('#box').remove()
    }, 3000) //closing box after 3 seconds
}

function boxSize(){
  $('.box').each(function(){
    l = ($(window).width()/2)-($(this).width()/2)
    if(l < 0)
      l = 0
    t = ($(window).height()/2)-($(this).height()/2)
    if(t < 0)
      t = 0
    $(this).attr('style', 'height:'+($(this).height()+6)+'px;width:'+($(this).width()+6)+'px;left:'+l+'px;top:'+t+'px;')
  })
  $('#lock').attr('style', 'width:'+$(window).width()+'px;height:'+$(window).height()+'px;')
}

function clueSize(){
  if($('#board').html() != ''){
    width = $(window).width() - ($('#board').width()+10+15)- 30
    if(width <=400)
      width = 400
    if($(window).height() > $('#board').height())
      height = ($(window).height()/2) -15-34-12-15
    else
      height = ($('#board').height()/2) -15-34-12-15
    $('#across').attr('style', 'width:'+width+'px;height:'+height+'px;')
    $('#down').attr('style', 'width:'+width+'px;height:'+height+'px;')
  }
}

function listLanguages(place, callback){
  ipcRenderer.send('list-languages')
  ipcRenderer.once('list-languages', function(event, languages){
    languages.forEach( (item) => {
      if(place.attr('class') == 'dropdown-menu'){
        li = $('<li/>').appendTo(place)
        element = $('<a/>', {'href': '#', 'data-value': item.language}).text(item.name).appendTo(li)
        element.click(function(){
          if($('#configurationPanel').text() || $('#classPanel').text() || $('#dictionaryPanel').text() || $('#boardPanel').text() || $('#crosswords').text())
            box(datalanguage['confirm'], datalanguage['askchangelanguage'], () => {
              closePainels()
              ipcRenderer.send('change-language', $(this).data('value'))
            })
          else
            ipcRenderer.send('change-language', $(this).data('value'))
        })
      }else
        element = $('<option/>').text(item.name).val(item.language).appendTo(place)
      if(typeof item.picture != 'undefined')
        $('<img/>', {'src': item.picture}).appendTo(element)
    })
    //sorting languages
    if(place.attr('class') == 'dropdown-menu')
      itemSort = place.children('li')
    else
      itemSort = place.children('option')
    itemSort.sort(function(a, b) {
      if($(b).val()){
        var upA = $(a).text().toUpperCase();
        var upB = $(b).text().toUpperCase();
        return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
      }
    }).appendTo(place)
    if(typeof callback == "function")
      callback(place)
  })
}

function boxProfile(){
    box(datalanguage['profile'], '')
    $('#box').attr('id', 'boxProfile')
    //$('#boxProfile .message').remove()
    $('#boxProfile .title input').unbind('click').click(function(){
      $('#boxProfile').remove()
      $('#lock').remove()
    })
    span = $('<span/>').text(datalanguage['login']+': ').appendTo($('#boxProfile'))
    $('<input/>', {'id': 'login', 'type': 'text', 'maxlenght': 50}).appendTo(span)
    span = $('<span/>').text(datalanguage['password']+': ').appendTo($('#boxProfile'))
    $('<input/>', {'id': 'password', 'type': 'password', 'maxlenght': 20, 'style': 'width:100px;'}).appendTo(span)
    $('<div/>', {'style': 'text-align:center', 'id': 'btnProfile'}).appendTo($('#boxProfile'))
    $('<input/>', {'type': 'button', 'id': 'submit', 'class': 'btn btn-primary'}).val(datalanguage['login']).appendTo($('#btnProfile'))
    $('<span/>').text('   ').appendTo($('#btnProfile'))
    $('<input/>', {'type': 'button', 'id': 'closeBox', 'class': 'btn btn-primary'}).val(datalanguage['close']).appendTo($('#btnProfile'))

    $('#closeBox').click(function(){
      $('#boxProfile').remove()
      $('#lock').remove()
    })
    $('#boxProfile input').keydown(function(){
      key = event.keyCode || event.charCode;
      if(key == 13) //enter
        $('#submit').click()
    })
    $('#submit').click(()=>{
      login = $('#login').val()
      passwd = $('#password').val()
      if(login == '')
        box(datalanguage['alert'], datalanguage['blankuser'])
      else if(passwd == '')
        box(datalanguage['alert'], datalanguage['blankpassword'])
      else
        hash(passwd, (password) => {
          send('login', {'login': login, 'password': password}, 'authenticated', ()=>{
            myUser.login = login
            myUser.password = password
            defaultMenu()
            configurationPanel.showConfigurationPanel()
            $('#update').show().unbind('click').click(configurationPanel.update)
            $('#close').show()
            setMask()
          })
        })
    })
    $('#login').focus()
}

function boxAdminPassword(){
  $('#menu').hide()
  box(datalanguage['system'], '')
  $('#box').attr('id', 'boxAdminPassword')
  $('#boxAdminPassword .title input').remove()
  $('#boxAdminPassword .message').text(datalanguage['emptypassword']).attr('class', 'alert alert-warning').attr('style', 'font-weight: bold; text-align: center')
  $('#boxAdminPassword span').remove()
  $('#btnProfile').html('')
  span = $('<span/>').text(datalanguage['currentpassword']+': ').appendTo($('#boxAdminPassword'))
  $('<input/>', {'id': 'currentpassword', 'type': 'password', 'maxlenght': 20, 'class': 'medium'}).appendTo(span)
  $('#currentpassword').focus()
  span = $('<span/>').text(datalanguage['password']+': ').appendTo($('#boxAdminPassword'))
  $('<input/>', {'id': 'admin_password', 'type': 'password', 'maxlenght': 20, 'class': 'medium'}).appendTo(span)
  span = $('<span/>').text(datalanguage['password']+': ').appendTo($('#boxAdminPassword'))
  $('<input/>', {'id': 'admin_password2', 'type': 'password', 'maxlenght': 20, 'class': 'medium', 'title': datalanguage['reenterpassword']}).appendTo(span)
  $('<br/>').appendTo($('#boxAdminPassword'))
  div = $('<div/>', {'style': 'text-align:center'}).appendTo($('#boxAdminPassword'))
  $('<input/>', {'type': 'button', 'id': 'submit', 'class': 'btn btn-primary'}).val(datalanguage['register']).appendTo(div).click(()=>{
    error = validatePassword($('#admin_password').val())
    if($('#currentpassword').val() == '')
      box(datalanguage['alert'], datalanguage['blankcurrentpassword'])
    else if($('#admin_password').val() == '' || $('#admin_password2').val() == '')
      box(datalanguage['alert'], datalanguage['blankpassword'])
    else if(error)
      box(datalanguage['alert'], datalanguage[error])
    else if($('#admin_password').val() != $('#admin_password2').val())
      box(datalanguage['alert'], datalanguage['passwordmismatch'])
    else
      hash($('#admin_password').val(), (passwd)=>{
        systemConfig.admin_password = passwd
        hash($('#currentpassword').val(), (currentpassword)=>{
          systemConfig.currentpassword = currentpassword
          send('change-adminpassword', systemConfig, 'configupdated', ()=>{
            $('#boxAdminPassword').remove()
            $('#lock').remove()
            $('#menu').show()
          })
        })
      })
  })
  $('#boxAdminPassword input').keydown(function(){
    key = event.keyCode || event.charCode;
    if(key == 13) //enter
      $('#submit').click()
  })
}

function defaultMenu(){
    $('#systemLanguage').show()
    $('#play').show()
    $('#configuration').show()

    if(typeof myUser.login != 'undefined'){
      $('#btnBoards').show()
      $('#btnClasses').show()
      $('#btnDictionaries').show()
      $('#quitadmin').show()
    }else{
      $('#btnBoards').hide()
      $('#btnClasses').hide()
      $('#btnDictionaries').hide()
      $('#quitadmin').hide()
    }

    $('#register').hide()
    $('#update').hide()
    $('#remove').hide()
    $('#evaluate').hide()
    $('#close').hide()
    $('#cancel').hide()
}

function hideItems(){
  $('#btnBoards').hide()
  $('#btnClasses').hide()
  $('#btnDictionaries').hide()
  $('#play').hide()
  $('#configuration').hide()
  $('#quitadmin').hide()
  $('#update').hide()
  $('#close').hide()
  $('#configurationPanel').remove()
  setMask()
}

function closePainels(){
  $('#boardPanel').remove()
  $('#crosswords').remove()
  $('#classPanel').remove()
  $('#dictionaryPanel').remove()
  $('#configurationPanel').remove()
  $('#Function').remove()
  $('#lock').remove()
  $('#boxProfile').remove()
  defaultMenu()
}

//creates the menu and functions
function createMenu(){
  $('<div/>', {'id': 'menu', 'class': 'panel'}).appendTo($('body'))
  $.get( "menu.html", function(data){
    $( "#menu" ).html( data );

    $('#createBoard').click(function(){
      boardPanel.showBoardPanel('new')
      hideItems()
      $('#register').show().unbind('click').click(boardPanel.register)
      $('#cancel').show()
    })
    $('#changeBoard').click(function(){
      boardPanel.showBoardPanel('change')
      hideItems()
      $('#update').show().unbind('click').click(boardPanel.update)
      $('#cancel').show()
    })
    $('#removeBoard').click(function(){
      boardPanel.showBoardPanel('remove')
      hideItems()
      $('#remove').show().unbind('click').click(boardPanel.remove)
      $('#close').show()
    })
    $('#createClass').click(function(){
      classPanel.showClassPanel('new')
      hideItems()
      $('#register').show().unbind('click').click(classPanel.register)
      $('#cancel').show()
    })
    $('#listClasses').click(function(){
      classPanel.showClassPanel('list')
      hideItems()
      $('#close').show()
    })
    $('#removeClass').click(function(){
      classPanel.showClassPanel('remove')
      hideItems()
      $('#remove').show().unbind('click').click(classPanel.remove)
      $('#close').show()
    })
    $('#createDictionary').click(function(){
      dictionaryPanel.showDictionaryPanel('new')
      hideItems()
      $('#register').show().unbind('click').click(dictionaryPanel.register)
      $('#cancel').show()
    })
    $('#changeDictionary').click(function(){
      dictionaryPanel.showDictionaryPanel('change')
      hideItems()
      $('#update').show().unbind('click').click(dictionaryPanel.update)
      $('#cancel').show()
    })
    $('#removeDictionary').click(function(){
      dictionaryPanel.showDictionaryPanel('remove')
      hideItems()
      $('#remove').show().unbind('click').click(dictionaryPanel.remove)
      $('#close').show()
    })
    $('#play').click(function(){
      boardPanel.showBoardPanel('play')
      hideItems()
      $('#close').show()
    })
    $('#configuration').click(function(){
      if(typeof myUser.login != 'undefined'){
        configurationPanel.showConfigurationPanel()
        $('#update').show().unbind('click').click(configurationPanel.update)
        $('#close').show()
      }else
        boxProfile()
    })
    $('#quitadmin').click(function(){
      myUser = {}
      defaultMenu()
      closePainels()
    })
    $('#evaluate').click(boardPanel.evaluate)
    $('#cancel').click(function(){
      box(datalanguage['confirm'], datalanguage['askcancel'], () => {
        closePainels()
      })
    })
    $('#close').click(function(){
      if($('#Function').html() == 'play' && !$('#boardPanel').html())
        box(datalanguage['confirm'], datalanguage['askclose'], ()=> {
          closePainels()
        })
      else
        closePainels()
    })
    $('#about').click(function(){
      message = $('<span/>').html(datalanguage['textabout']+'<br/><b>'+datalanguage['version']+': '+version+'</b>')
      box(datalanguage['about'], message)
    })
    $('#quit').click(function(){
      ipcRenderer.send('quit')
    })
    listLanguages($('#systemLanguage ul'))
    defaultMenu()
  });
}
