//TODO:
//ao fechar tabuleiro ou sair do programa, salvar as palavras escritar para poder voltar a jogar posteriormente.

//ao desistir de completar o tabuleiro, colocar a opção de exibir todas as palavras
//reflexão: até que ponto o usuário é confiável e não vai usar este recurso para colar e se sabotar para tirar uma nota boa?
//habilitar esta opção somente quando for registrar a nota no login do usuário?

board = require('./board.js')

module.exports = {
  register: () => {
    send('register-board', preview_board, 'boardregistered')
  },
  update: () => {
    send('update-board', preview_board, 'boardupdated')
  },
  remove: () => {
    this_board = $('#board').val()
    if(this_board == '')
      box(datalanguage['alert'], datalanguage['selectboard'])
    else
      box(datalanguage['confirm'], datalanguage['askremove'],function(){
        send('delete-board', this_board, 'boarddeleted')
      })
  },
  //creating the panel to create/change crosswords
  showBoardPanel: (action) => {
    acrosswords=0;
    downwords=0;
    w=0;
    max_size = systemConfig.board_config.max_size
    preview_board = {};
    board.highlighted=0
    $('<div/>', {'id': 'boardPanel', 'class': 'panel', 'style': 'height:'+($(window).height()-100)+'px'}).appendTo($('body'))
    left = $('<div/>', {'class': 'pull-left'}).appendTo('#boardPanel')
    if(action == 'new'){
      preview_board = {
        "name": "",
        "class": "",
        "width": 10,
        "height": 10,
        "locale": datalanguage['langLocale'],
        "across": [],
        "down": []
      };
      $('<div/>', {'id': 'Function'}).hide().html('new').appendTo($('body'))
      showBoardFields()
      board.previewBoard()
    }
    else if (action == 'change'){
      $('<span/>').html(datalanguage['board']+': ').appendTo(left)
      $('<div/>', {'id': 'Function'}).hide().html('change').appendTo($('body'))
      $('<select/>', {'id': 'board'}).appendTo(left).change(function(){
        if($('#name').val() || $('#class').val()){
          box(datalanguage['confirm'], datalanguage['losechanges'], () => {
            if($('#board').val())
              loadBoard($("#board option:selected" ).text(), 'change')
            else{
              $('#fields').remove()
              $('#crosswords').remove()
              $('#right').remove()
            }
          })
        }else
          loadBoard($("#board option:selected" ).text(), 'change')
      })
      listBoards()
      $('<br/>').appendTo(left)
    }
    else if (action == 'remove'){
      $('<span/>').html(datalanguage['board']+': ').appendTo(left)
      $('<select/>', {'id': 'board'}).appendTo(left)
      listBoards()
    }
    else if(action == 'play'){
    $('<div/>', {'id': 'Function'}).hide().html('play').appendTo($('body'))
      $('<div/>', {'id': 'items'}).appendTo($('#boardPanel'))
      showClasses()
    }
  },
  evaluate: () => {
    box(datalanguage['confirm'], datalanguage['askevaluate'], () => {
      board.getWords( (this_board) => {
        for(w=this_board.words.length-1;w>0;w--)
          if(typeof this_board.words[w].tick != undefined && this_board.words[w].tick == 'true')
            this_board.words.splice(w, 1)

        ipcRenderer.send('evaluate-board', {"board": this_board, "evaluation": board.evaluation})
        ipcRenderer.once('evaluate-board', function(event, result){
          msg = result[0]
          board.evaluation = result[1]
          //tick all correct words
          board.evaluation.correct_words.forEach( (number)=>{
            board.highlight(number, 'tick')
          })

          //remove any highlighted word
          $('#board tr input.highlight').attr('class', '')
          $('.game .clues ul li.highlight').attr('class', '')
          board.highlighted = 0

          //close if all words are correct
          //if(board.evaluation.correct_words.length == preview_board.total)
          //  closePainels()

          message = '<b>'+datalanguage['evaluationresult'].replace('{correct}', board.evaluation.correct_words.length).replace('{total}', preview_board.total)+'<br>'+datalanguage['score']
          +': '+board.evaluation.score+'</b><br/>'+datalanguage[msg]
          if(msg == 'tryagain' || msg == 'congratulations')
            box(datalanguage['evaluation'], message)
        })
      })
    })
  },
  save: (callback)=>{
    board.getWords( (this_board)=>{
      this_board.evaluation = board.evaluation
      send('save-board', this_board, 'boardsaved', ()=>{
        $('#box').remove()
        callback()
      })
    })
  }

}

function showClasses(){
    classPanel.getClasses().then( (arvore) => {
      width = $('#boardPanel').width()/3
      arvore.items.forEach( (item) => {
        div = $('<div/>', {'style': 'min-height:54px;margin-bottom:3px'}).attr('data-order', item.order).appendTo($('#items'))
        $('<a/>', {'style': 'max-width:'+width+'px;white-space: pre-line'}).attr('class', 'btn btn-primary').attr('href', '#').text(item.num+'-'+item.name).attr('data-val', item.id).appendTo(div).click(function(){
          showBoards($(this).attr('data-val'))
        })
      })

      //sorting classes
      $('#items').children('div').sort( (a, b) => {
        if($(b).children('a').text()){
          var upA = $(a).attr('data-order').toUpperCase();
          var upB = $(b).attr('data-order').toUpperCase();
          return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
        }
      }).appendTo($('#items'))

      $('<div/>', {'id': 'alertInfo'}).attr('class', 'alert alert-info').attr('style', 'font-weight: bold; text-align: center').html(datalanguage['selectclass']).appendTo($('#boardPanel'))
      createPages($('#items').children('div'), 'tableClasses')
      $('<input/>', {'id': 'pageClasses', 'type': 'hidden'}).val(1).appendTo($('#boardPanel'))
      ipcRenderer.send('get-lastsavedboard', datalanguage['langLocale'])
      ipcRenderer.once('get-lastsavedboard', (event, last_board) => {
        total_words = last_board.across.length+last_board.down.length
        if(typeof last_board.evaluation != 'undefined')
          if(typeof last_board.evaluation.correct_words == 'undefined' || total_words > last_board.evaluation.correct_words.length){
            box(datalanguage['confirm'], datalanguage['playlastboard'], function(){
              playSaved(last_board)
            })
            $('#box .title').html($('#box .title').html().replace(datalanguage['confirm'], datalanguage['system']))
          }
      })
    })
}

function createPages(items, tableId){

      table = $('<table/>').attr('style', 'width:100%;text-align:center;margin-left:0px').attr('id', tableId).appendTo($('#boardPanel'))
      tr = $('<tr/>',).appendTo(table)
      left = $('<td/>').attr('style', 'width:33.3%;vertical-align: top').appendTo(tr)
      center = $('<td/>').attr('style', 'width:33.3%;vertical-align: top').appendTo(tr)
      right = $('<td/>').attr('style', 'width:33.3%;vertical-align: top').appendTo(tr)
      tr2 = $('<tr/>').appendTo(table)
      pages = $('<td/>').attr('colspan', 3).appendTo(tr2)

      nside = (($('#boardPanel').height()-$('#alertInfo').outerHeight(true)-110)/60).toFixed(0)
      if(nside<1)
        nside=1

      //creating pages
      page=0
      side=0
      $('<div/>').attr('id', 'page').text(datalanguage['page']).appendTo(pages)
      ul = $('<ul/>').attr('class', 'pagination').appendTo(pages)
      items.each( (i, item) => {
        if(i%nside == 0)
          side++
        if(i%(nside*3) == 0){
          page++
          li = $('<li/>').appendTo(ul)
          a = $('<a/>').attr('href', '#').text(page).appendTo(li).click(function(){
            if($(this).parent().attr('class') == 'active')
              return
            changePage($(this).text(), $('#'+tableId))
          })
          if(page == 1)
            li.attr('class', 'active')
        }
        if(page%2 == 0){
          if(side%3 == 0)
            $(item).appendTo(right)
          else if(side%2 == 0)
            $(item).appendTo(left)
          else
            $(item).appendTo(center)
        }else {
            if(side%2 == 0)
              $(item).appendTo(center)
            else if(side%3 == 0)
              $(item).appendTo(right)
            else
              $(item).appendTo(left)
        }
        $(item).attr('data-page', page)
        //hide other pages
        if(page > 1)
            $(item).hide()
      })
      height = $('#boardPanel').height()-$('#alertInfo').outerHeight()-parseInt($('#alertInfo').css('margin-bottom'))-tr2.outerHeight()-10
      //if(height<0)
      //  margin=0
      tr.attr('style', 'height:'+height+'px')
}

function changePage(page, table){
  table.children('tr').children('td').children('ul').children('li').each( (i, item) => {
    if($(item).text() == page)
      $(item).attr('class', 'active')
    else {
      $(item).attr('class', '')
    }
  })
  table.children('tr').children('td').children('div').each( (i, item) => {
    if($(item).attr('id') != 'page')
    if($(item).attr('data-page') == page)
      $(item).show()
    else
      $(item).hide()
  })
  if($('#tableClasses').is(':visible'))
    $('#pageClasses').val(page)
}

function listBoards(){ //used to create/change boards
  ipcRenderer.send('list-boards', datalanguage['langLocale'])
  ipcRenderer.once('list-boards', (event, boards) => {
      $('<option/>').attr('value', '').text(datalanguage['select']).appendTo($('#board'))
      boards.forEach( (element) => {
        if(element.name != "#random#")
          op = $('<option/>').attr('value', element.id).text(element.name).appendTo($('#board'))
      })
      //sorting boards
      $('#board').children('option').sort( (a, b) => {
        if($(b).val()){
          var upA = $(a).text().toUpperCase();
          var upB = $(b).text().toUpperCase();
          return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
        }
      }).appendTo($('#board'))
      $("#board").val('').prop("selected", true);
  })
}

function showBoards(classe){ //used to play
  $('#classes').remove()
  $('#alertInfo').html(datalanguage['selectboard'])
  width = $('#boardPanel').width()/3
  ipcRenderer.send('list-boards', {"locale": datalanguage['langLocale'], "class": classe})
  ipcRenderer.once('list-boards', (event, boards) => {

      boards.forEach( (item) => {
        if(item.name != "#random#"){
            div = $('<div/>', {'style': 'min-height:54px;margin-bottom:3px'}).appendTo($('#items'))
            a = $('<a/>', {'style': 'max-width:'+width+'px; white-space: pre-line'}).attr('class', 'btn btn-primary').text(item.name).attr('href', '#').attr('data-val', item.id).appendTo(div)
            a.click(function(){
              $('#boardPanel').remove()
              $('#evaluate').show()
              loadBoard($(this).text(), 'play')
            })
        }
      })

      //sorting boards
      $('#items').children('div').sort( (a, b) => {
        if($(b).children('a').text()){
          var upA = $(a).children('a').text().toUpperCase();
          var upB = $(b).children('a').text().toUpperCase();
          return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
        }
      }).appendTo($('#items'))
      $('#tableClasses').hide()
      items = $('#items').children('div')

      ipcRenderer.send('get-dictionaries', classe)
      ipcRenderer.once('get-dictionaries', (event, dictionaries) => {
        if(items.length > 0){
          createPages(items, 'tableBoards')
        }
        else
          $('#alertInfo').html(datalanguage['emptyclass'])

        if(dictionaries.length > 0){
          $('<br/>').appendTo($('#alertInfo'))
          $('<a/>').attr('href', '#').text(datalanguage['playrandomboard']).appendTo($('#alertInfo')).click(function(){
            box(datalanguage['level'], '')
            $('#box').attr('id', 'boxLevel')
            $('#boxLevel .title input').unbind('click').click(function(){
              $('#boxLevel').remove()
              $('#lock').remove()
            })
            $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': '0'}).val(datalanguage['easy']).appendTo($('#boxLevel .message')).click(function(){
              playRandom({"class": classe, "level": 0})
            })
            $('<br/>').appendTo($('#boxLevel .message'))
            $('<br/>').appendTo($('#boxLevel .message'))
            $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': '1'}).val(datalanguage['medium']).appendTo($('#boxLevel .message')).click(function(){
              playRandom({"class": classe, "level": 1})
            })
            $('<br/>').appendTo($('#boxLevel .message'))
            $('<br/>').appendTo($('#boxLevel .message'))
            $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': '2'}).val(datalanguage['hard']).appendTo($('#boxLevel .message')).click(function(){
              playRandom({"class": classe, "level": 2})
            })
            $('<br/>').appendTo($('#boxLevel .message'))
            $('<br/>').appendTo($('#boxLevel .message'))
            $('<input/>', {'type': 'button', 'class': 'btn btn-primary', 'title': '3'}).val(datalanguage['mixed']).appendTo($('#boxLevel .message')).click(function(){
              playRandom({"class": classe, "level": 3})
            })
          })
        }
        if($('#alertInfo').html() == datalanguage['emptyclass'])
          $('#alertInfo').attr('class', 'alert alert-warning')

        $('<br/>').appendTo($('#alertInfo'))
        $('<a/>').attr('href', '#').text(datalanguage['back']).appendTo($('#alertInfo')).click(function(){
          $('#tableBoards').remove()
          $('#tableClasses').show()
          //changePage($('#pageClasses').val(), $('#tableClasses'))
          $('#alertInfo').attr('class', 'alert alert-info').html(datalanguage['selectclass'])
        })
      })
  })
}


//creating board fields
function showBoardFields(){
  $('#fields').remove()
  $('#right').remove()
  fields = $('<div/>', {'id': 'fields'}).appendTo(left)
  $('<span/>').html(datalanguage['name']+': ').appendTo(fields)
  $('<input/>', {'id': 'name', 'maxlength': systemConfig.max_name_length, 'class': 'lettersAndNumbers', 'value': preview_board['name']}).appendTo(fields).keyup(function(){
    preview_board['name'] = $(this).val()
  })
  $('<br>').appendTo(fields)
  $('<span/>').html(datalanguage['class']+': ').appendTo(fields)
  $('<select/>', {'id': 'class'}).appendTo(fields).change(function(){
    preview_board.class = this.value
  })
  $('<option/>').attr('value', '').text(datalanguage['select']).appendTo($('#class'))
  classPanel.classesSelect($('#class'), preview_board.class)
  $('<br>').appendTo(fields)
  $('<strong/>').html(datalanguage['boardsize']).appendTo(fields)
  $('<br>').appendTo(fields)
  $('<span/>').html(datalanguage['lines']+': ').appendTo(fields)
  $('<input/>', {'id': 'lines', 'class': 'small', 'value': 10, 'type': 'number', 'max': max_size, 'min': 1, 'value': preview_board['height']}).appendTo(fields).change(function(){
    checkSize($(this), 'height')
  })
  $('<br>').appendTo(fields)
  $('<span/>').html(datalanguage['collumns']+': ').appendTo(fields)
  $('<input/>', {'id': 'collumns', 'class': 'small', 'value': 10, 'type': 'number', 'max': max_size, 'min': 1, 'value': preview_board['width']}).appendTo(fields).change(function(){
    checkSize($(this), 'width')
  })
  $('<br>').appendTo(fields)
  $('<div/>', {'id': 'acrosswords'}).appendTo(fields)
  $('<strong/>').html(datalanguage['acrosswords']).appendTo('#acrosswords')
  $('<br>').appendTo('#acrosswords')
  $('<table/>').appendTo('#acrosswords')
  for(i=0;i<preview_board.across.length;i++)
    addWordToPanel('across', preview_board.across[i])
  $('<input/>', {'type': 'button', 'class': 'addword'}).attr('value', datalanguage['add']).appendTo('#acrosswords').click(function(){
    addWordToPanel('across', {'number': 0, 'word': '', 'text': '', 'first': [1, 1]})
    $('#word-'+w).focus()
  })
  $('<div/>', {'id': 'downwords'}).appendTo(fields)
  $('<strong/>').html(datalanguage['downwords']).appendTo('#downwords')
  $('<br>').appendTo('#downwords')
  $('<table/>').appendTo('#downwords')
  for(i=0;i<preview_board.down.length;i++)
    addWordToPanel('down', preview_board.down[i])
  $('<input/>', {'type': 'button', 'class': 'addword'}).attr('value', datalanguage['add']).appendTo('#downwords').click(function(){
    addWordToPanel('down', {'number': 0, 'word': '', 'text': '', 'first': [1, 1]})
    $('#word-'+w).focus()
  })
  if(!$('#name').val())
    $('.addword').trigger('click')
  $('<div/>', {'class': 'pull-right', 'id': 'right'}).appendTo('#boardPanel')
  $('<strong/>').html(datalanguage['preview']).appendTo($('#right'))
  $('#name').focus()
  $('#fields input').keydown(function(){
    key = event.keyCode || event.charCode;
    if(key == 13){ //enter
      if(!$('#box').html() && !$('#boxProfile').html()){
        if(!$('#register').attr('style'))
          $('#register').click()
        if(!$('#update').attr('style'))
          $('#update').click()
      }
    }
  })
  setMask()
}

//adding new fields to the creation panel for a new word
function addWordToPanel(type, word){
    w++
    if(word.number == 0){
      word.number = w
      preview_board[type].push(word)
    }

    if(type == 'across'){
      acrosswords++
      //nwords = acrosswords
      id = 'acrosswords'
    }else if(type == 'down'){
      downwords++
      //nwords = downwords
      id = 'downwords'
    }
    tr = $('<tr/>', {'class': 'tr-'+word.number}).appendTo(`#${id} table`)
    td = $('<td/>').appendTo(tr)
    $('<span/>').html(datalanguage['word']+' '+word.number+' '/*+' '+nwords //shows number by type*/).appendTo(td)
    $('<input/>', {'id': 'word-'+word.number, 'data-num': word.number, 'data-type': type, 'class': 'medium letters', 'maxlength': max_size, 'value': word.word}).appendTo(td).focusout(function(){
      tp = $(this).data('type')
      length = parseInt($(this).val().length)
      if(tp == 'across' && parseInt($('#collumns').val()) < length){
        $('#collumns').val(length)
        preview_board['width'] = parseInt(length)
      }else if(tp == 'down' && parseInt($('#lines').val()) < length){
        $('#lines').val(length)
        preview_board['height'] = parseInt(length)
      }
      updateWord($(this).data('num'),tp)
      board.previewBoard()
    }).keyup(function(){
      key = event.keyCode || event.charCode;
      if(key == 13)
        $(this).focusout()
    })
    td = $('<td/>').appendTo(tr)
    $('<span/>').html('X:').appendTo(td)
    $('<input/>', {'id': 'firstx-'+word.number, 'value': 1, 'data-num': word.number, 'data-type': type, 'data-direction': 'x', 'class': 'small', 'type': 'number', 'max': max_size, 'min': 1, 'value': word.first[1]}).appendTo(td).on('change',function(){
      checkFirst($(this))
    })
    td = $('<td/>').appendTo(tr)
    $('<span/>').html('Y:').appendTo(td)
    $('<input/>', {'id': 'firsty-'+word.number, 'value': 1, 'data-num': word.number, 'data-type': type, 'data-direction': 'y', 'class': 'small', 'type': 'number', 'max': max_size, 'min': 1, 'value': word.first[0]}).appendTo(td).on('change',function(){
      checkFirst($(this))
    })
    $('<span/>').html('&nbsp;&nbsp;').appendTo(td)
    $('<input/>', {'id': 'removeword', 'type': 'button', 'value': ' - ', 'data-num': word.number, 'data-type': type}).appendTo(td).click(function(){
      num = $(this).data('num')
      type = $(this).data('type')
      box(datalanguage['confirm'], datalanguage['askremoveword'], () => {
        $('.tr-'+num).remove()
        index = preview_board[type].findIndex(x => x.number === num)
        if(index > -1)
          preview_board[type].splice(index, 1)
        board.previewBoard()
      })
    })
    tr = $('<tr/>', {'class': 'tr-'+word.number}).appendTo(`#${id} table`)
    td = $('<td/>', {'colspan': 3}).appendTo(tr)
    $('<span/>').html(datalanguage['clue']+' '/*+' '+nwords //shows number by type*/).appendTo(td)
    $('<input/>', {'id': 'clue-'+word.number, 'data-num': word.number, 'data-type': type, 'maxlength': systemConfig.max_clue_length, 'value': word.text, 'style': 'width:230px'}).appendTo(td).keyup(function(){
      updateWord($(this).data('num'),$(this).data('type'))
    })
    setMask()
}

//check size of a word
function checkSize(element, change){
  if($.isNumeric(element.val())){
    if(element.val() > max_size)
      element.val(max_size)
    if(element.val() < 1)
      element.val(1)
    //checking the last letter in row/collumn before changing
    min_c = 0
    min_r = 0
    $('#board tr input').each(function(){
      pos = $(this).parent().attr('id').split('-')
      if(parseInt(pos[1]) > min_r)
        min_r = pos[1]
      else if(parseInt(pos[2]) > min_c)
        min_c = pos[2]
    })
    if(element.val() < parseInt(min_c) && change == 'width')
      element.val(min_c)
    else if(element.val() < parseInt(min_r) && change == 'height')
      element.val(min_r)
  }else
    element.val(10)
  preview_board[change] = parseInt(element.val())
  board.previewBoard()
}

//check position of a word
function checkFirst(element){
  if($.isNumeric(element.val())){
    if(element.data('type') == 'across' && element.data('direction') == 'x')
      max = parseInt($('#collumns').val())-parseInt($('#word-'+element.data('num')).val().length)+1
    else if(element.data('type') == 'across' && element.data('direction') == 'y')
      max = parseInt($('#lines').val())
    else if(element.data('type') == 'down' && element.data('direction') == 'x')
      max = parseInt($('#collumns').val())
    else if(element.data('type') == 'down' && element.data('direction') == 'y')
      max = parseInt($('#lines').val())-parseInt($('#word-'+element.data('num')).val().length)+1
    if(element.val() > max)
      element.val(max)
    if(element.val() < 1)
      element.val(1)
    updateWord(element.data('num'),element.data('type'))
    board.previewBoard()
  }else
    element.val(1)
}

//updating the word in preview_board list
function updateWord(number, type){
    var this_word={};
    this_word.number = number
    this_word.text = $('#clue-'+this_word.number).val()
    this_word.word = $('#word-'+this_word.number).val()
    this_word.first = [ $('#firsty-'+this_word.number).val(), $('#firstx-'+this_word.number).val() ]
    change = preview_board[type].findIndex(x => x.number === this_word.number)
    if(change == -1){
      preview_board[type].push(this_word)
    }else
      preview_board[type][change] = {'number': this_word.number, 'text': this_word.text, 'word': this_word.word, 'first': this_word.first }
}

function loadBoard(name, type){
  if(type == 'change')
    conn = 'get-board'
  else if(type == 'play')
    conn = 'load-board'
  ipcRenderer.send(conn, {"name": name, "locale": datalanguage['langLocale']})
  ipcRenderer.once(conn, (event, this_board) => {
    this_board.total = this_board.across.length+this_board.down.length
    preview_board = this_board
    preview_board['oldname'] = $("#board option:selected").text()
    if(type == 'play'){
      board.previewBoard()
      board.showClues(preview_board)
      clueSize()
    }else if (type == 'change'){
      showBoardFields()
      board.previewBoard()
    }
  })
}

function playRandom(conf){
  ipcRenderer.send('generate-randomboard', conf)
  ipcRenderer.once('generate-randomboard', (event, this_board) => {
    if(this_board == 'insuficientwords' || this_board == 'generatingboarderror')
      box(datalanguage['alert'], datalanguage[this_board])
    else{
      preview_board = this_board
      $('#boardPanel').remove()
      $('#evaluate').show()
      board.previewBoard()
      board.showClues(preview_board)
      clueSize()
      $('#boxLevel .title input').click()
    }
  })
}

function playSaved(this_board){
  $('#boardPanel').remove()
  $('#evaluate').show()
  saved = this_board.saved
  preview_board = this_board
  board.previewBoard()
  board.showClues(preview_board)
  clueSize()
  board.evaluation = this_board.evaluation
  board.setWords(saved)
  $('#box .title input').click()
}
