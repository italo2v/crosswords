module.exports = {
  evaluation: {},
  highlighted: 0,
  //show the board preview in the creation panel
  previewBoard: () => {
    module.exports.evaluation = {}
    preview_board.total = preview_board.across.length+preview_board.down.length
    showBoard(preview_board)
    addWords(preview_board)
  },
  getWords: (callback) => {
    //replacing special letters
    special_letters = "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝŔÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŕ";
    normal_letters = "AAAAAAACEEEEIIIIDNOOOOOOUUUUYRsBaaaaaaaceeeeiiiionoooooouuuuybyr";
    this_words = []
    for(w=1;w<=preview_board.total;w++){
      letters = ''
      $('#board input').each(function(){
          if($(this).data('num') == w || $(this).data('num2') == w){
            letter = $(this).val()
            if(letter == '')
              letter = '*'
            for(l=0;l<special_letters.length;l++){
              letter = letter.replace(special_letters[l], normal_letters[l])
            }
            letters += letter
          }
      })
      this_word = {"number": w, "word": letters}
      $('.game .clues ul li').each(function(){
        if($(this).attr('class') == 'tick' && $(this).data('num') == w)
          this_word.tick = 'true'
      })
      this_words.push(this_word)
    }
    this_board = {"id": preview_board.id, "name": preview_board.name, "locale": preview_board.locale, "words": this_words}
    callback(this_board)
  },
  setWords: (words)=>{
    words.forEach((word) => {
      if(word.word.length > 0)
        $('#board input').each(function(){
            if($(this).data('num') == word.number || $(this).data('num2') == word.number){
              if(word.word[0] != '*' && word.word[0] != ' ' && word.word[0] != '-')
                $(this).val(word.word[0])
              word.word = word.word.substring(1)
            }
        })
      if(typeof word.tick != undefined && word.tick == 'true')
        module.exports.highlight(word.number, 'tick')
    })
    //remove any highlighted word
    $('#board tr input.highlight').attr('class', '')
    $('.game .clues ul li.highlight').attr('class', '')
    board.highlighted = 0
  },
  //showing clues to the game
  showClues: (board) => {

    span8 = $('<div/>', {'class': 'span-8 last'}).appendTo(game)
    for(i=0;i<2;i++){
      if(i==0)
        type = 'across'
      else if(i==1)
        type = 'down'
      //creating clue elements
      clues = $('<div/>', {'id': type, 'class': 'clues'}).appendTo(span8)
      strong = $('<strong/>').appendTo(clues)
      $('<div/>').html(datalanguage[type]).appendTo(strong)
      ul = $('<ul/>', {'class': type}).appendTo(clues)

      //writing words to board
      words = board[type]
      words.forEach( (word) => {
        //add clues
        $('<li/>').attr('data-num', word.number).html(`${word.number}. ${word.text}. (${word.word.length})`).appendTo(ul).click(function(){
          if(!$(this).attr('class') || $(this).attr('class') == ''){
            module.exports.highlight(module.exports.highlighted, '')
            module.exports.highlight($(this).data('num'), 'highlight')
            inputs = $('#board input.highlight')
            for(i=0;i<=inputs.length-1;i++){
              input = $(inputs[i])
              if((input.attr('data-num') == word.number || input.attr('data-num2') == word.number) && (input.val() == '' || i == inputs.length-1)){
                input.focus()
                break
              }
            }
          }
        })
      })
    }
  },
  highlight: (number, className) => {
      module.exports.highlighted = number
    $('#board input').each(function(){
      if($(this).data('num') == number || $(this).data('num2') == number){
        if($(this).attr('disabled') != 'disabled')
          $(this).attr('class', className)
        if(className == 'tick')
          $(this).attr('readonly', 'readonly').unbind()
      }
    })
    $('.game .clues ul li').each(function(){
      if($(this).data('num') == number)
        $(this).attr('class', className)
    })
  }
}

function showBoard(board){
  //creating board elements
  $('#crosswords').remove()
  if($('#boardPanel').text())
    where = $('#boardPanel .pull-right')
  else
    where = $('body')
  $('<div/>', { "id": 'crosswords'}).appendTo(where)
  game = $('<div/>', { "class": 'game'}).appendTo("#crosswords")
  span10 = $('<div/>', { "class": 'span-10'}).appendTo(game)
  grid = $('<div/>', { "class": 'grid'}).appendTo(span10)
  table = $('<table/>', { "id": 'board'}).appendTo(grid)
  tbody = $('<tbody/>').appendTo(table)
  //generating rows
  var row=[], line=[];
  for(i=1;i<=board.height;i++){
    row[i] = $('<tr/>').appendTo(tbody)
    //generating collumns
    for(j=1;j<=board.width;j++){
      line[j] = $('<td/>', {'id': `cell-${i}-${j}`}).html(' ').appendTo(row[i])
    }
  }
}

//adding words to the board
function addWords(board){

  //writing words to board
  for(i=0;i<2;i++){
    if(i==0)
      type = 'across'
    else if(i==1)
      type = 'down'
    words = board[type]
    words.forEach( (word) => {

      row = word.first[0]
      col = word.first[1]
      //selecting col or row for start loop
      if(type == 'across'){
        first = col
      }else if(type == 'down'){
        first = row
      }

      //adding the word number
      number = $(`#cell-${row}-${col} .number`)
      if(number.html())
        number.html(word.number+'\\'+number.html())
      else
        number = $('<span/>', {'class': 'number'}).html(word.number).appendTo($(`#cell-${row}-${col}`))
      last = parseInt(first)+parseInt(word.word.length);
      for(l=first;l<last;l++){
        //selecting col or row to be updated in loop
        if (type == 'across')
          col = l
        else if(type == 'down')
          row = l

        if($(`#cell-${row}-${col} input`).length){
          //adding second word number
          input = $(`#cell-${row}-${col} input`).attr('data-num2', word.number)
          if(module.exports.highlighted == word.number && ($('#Function').text() == 'change' || $('#Function').text() == 'new')){
            input.unbind('focus').focus()
            if(!$(`#cell-${row}-${col} input`).hasClass('highlight'))
              $(`#cell-${row}-${col} input`).attr('class', 'highlight')
          }
        }else{
          //adding the input field
          input = $('<input/>', {'type': 'text', 'maxlength': 1, 'class': 'lettersBoard', 'data-num': word.number}).appendTo($(`#cell-${row}-${col}`))

          /*if(word.level == 0)
            input.attr('style', 'background-color:green')
          else if(word.level == 1)
            input.attr('style', 'background-color:yellow')
          else if(word.level == 2)
            input.attr('style', 'background-color:red')
          */
          if(module.exports.highlighted == word.number && ($('#Function').text() == 'change' || $('#Function').text() == 'new')){
            input.unbind('focus').focus()
            if(!$(`#cell-${row}-${col} input`).hasClass('highlight'))
              $(`#cell-${row}-${col} input`).attr('class', 'highlight')
          }
          //skiping trace and space to fulfillment
          if(word.word[l-first] == '-'){
            $(`#cell-${row}-${col} input`).val('-').attr('readonly', 'readonly').attr('disabled', 'disabled').attr('style', 'background-color:#464646;color:black;font-weight:bold;font-size:28px')
          }
          else if(word.word[l-first] == ' '){
            $(`#cell-${row}-${col} input`).val(' ').attr('readonly', 'readonly').attr('disabled', 'disabled').attr('style', 'background-color:#464646;color:black;font-weight:bold;font-size:28px')
          }
          input.mousedown(function(){
            //chaging to across or down highlight when click on input that cross words
            if($(this).data('num2') && $(this).is(':focus')){
              if(module.exports.highlighted == $(this).data('num')){
                module.exports.highlight($(this).data('num'), '')
                module.exports.highlight($(this).data('num2'), 'highlight')
              }else if(module.exports.highlighted == $(this).data('num2')){
                module.exports.highlight($(this).data('num2'), '')
                module.exports.highlight($(this).data('num'), 'highlight')
              }
            }
          })
          input.focus(function(){
            if(!$(this).hasClass('highlight')){
              module.exports.highlight(module.exports.highlighted, '')
              module.exports.highlight($(this).data('num'), 'highlight')
            }
          })
          if($('#Function').text() == 'play'){
            input.keyup(function(){
              cell = $(this).parent().attr('id').split('-')
              //changing to previus input on press backspace
              key = event.keyCode || event.charCode
              if(key == 8 && !deleted){ //skip when delete using backspace
                if($(this).val() == ''){
                  if($(`#cell-${cell[1]}-${parseInt(cell[2])-1} input`).hasClass('highlight'))
                    $(`#cell-${cell[1]}-${parseInt(cell[2])-1} input`).focus()
                  if($(`#cell-${parseInt(cell[1])-1}-${cell[2]} input`).hasClass('highlight'))
                    $(`#cell-${parseInt(cell[1])-1}-${cell[2]} input`).focus()
                  //changing 2 inputs in case of trace or tick
                  if($(`#cell-${cell[1]}-${parseInt(cell[2])-1} input`).attr('readonly') == 'readonly')
                    if($(`#cell-${cell[1]}-${parseInt(cell[2])-2} input`).hasClass('highlight'))
                      $(`#cell-${cell[1]}-${parseInt(cell[2])-2} input`).focus()
                  if($(`#cell-${parseInt(cell[1])-1}-${cell[2]} input`).attr('readonly') == 'readonly')
                    if($(`#cell-${parseInt(cell[1])-2}-${cell[2]} input`).hasClass('highlight'))
                      $(`#cell-${parseInt(cell[1])-2}-${cell[2]} input`).focus()
                }
              }
              //changing to next input when insert value
              if(key != 37 && key != 38 && key != 39 && key != 40) //skip when use arrows
                if($(this).val()){
                  if($(`#cell-${cell[1]}-${parseInt(cell[2])+1} input`).hasClass('highlight'))
                    $(`#cell-${cell[1]}-${parseInt(cell[2])+1} input`).focus()
                  if($(`#cell-${parseInt(cell[1])+1}-${cell[2]} input`).hasClass('highlight'))
                    $(`#cell-${parseInt(cell[1])+1}-${cell[2]} input`).focus()
                  //changing 2 inputs in case of trace or tick
                  if($(`#cell-${cell[1]}-${parseInt(cell[2])+1} input`).attr('readonly') == 'readonly')
                    if($(`#cell-${cell[1]}-${parseInt(cell[2])+2} input`).hasClass('highlight'))
                      $(`#cell-${cell[1]}-${parseInt(cell[2])+2} input`).focus()
                  if($(`#cell-${parseInt(cell[1])+1}-${cell[2]} input`).attr('readonly') == 'readonly')
                    if($(`#cell-${parseInt(cell[1])+2}-${cell[2]} input`).hasClass('highlight'))
                      $(`#cell-${parseInt(cell[1])+2}-${cell[2]} input`).focus()
                }
            })
            input.keydown(function(){
              //canceling input change when deleting letter
              deleted = false
              key = event.keyCode || event.charCode;
              if(key == 8){ //backspace
                if($(this).val())
                  deleted = true
              }
              //detect arrow keys
              cell = $(this).parent().attr('id').split('-')
              cell1 = cell[1]
              cell2 = cell[2]
              m = 1
              while($(`#cell-${cell1}-${cell2} input`).length){
                if(key == 37){ //left
                  cell1 = cell[1]
                  cell2 = parseInt(cell[2])-m
                }
                if(key == 38){ //up
                  cell1 = parseInt(cell[1])-m
                  cell2 = cell[2]
                }
                if(key == 39){ //right
                  cell1 = cell[1]
                  cell2 = parseInt(cell[2])+m
                }
                if(key == 40){ //down
                  cell1 = parseInt(cell[1])+m
                  cell2 = cell[2]
                }
                if($(`#cell-${cell1}-${cell2} input`).attr('readonly') != 'readonly'){
                  $(`#cell-${cell1}-${cell2} input`).focus()
                  break
                }
                m++
              }
            })
          }else{
            if($('#Function').text() == 'change' || $('#Function').text() == 'new'){
              input.keydown(function(){
                //moving word in the board
                key = event.keyCode || event.charCode;
                //detect arrow keys
                num = module.exports.highlighted
                if(key == 37){ //left
                  val = parseInt($('#firstx-'+num).val())
                  $('#firstx-'+num).val(val-1)
                  $('#firstx-'+num).change()
                }
                if(key == 38){ //up
                  val = parseInt($('#firsty-'+num).val())
                  $('#firsty-'+num).val(val-1)
                  $('#firsty-'+num).change()
                }
                if(key == 39){ //right
                  val = parseInt($('#firstx-'+num).val())
                  $('#firstx-'+num).val(val+1)
                  $('#firstx-'+num).change()
                }
                if(key == 40){ //down
                  val = parseInt($('#firsty-'+num).val())
                  $('#firsty-'+num).val(val+1)
                  $('#firsty-'+num).change()
                }
              })
            }
            //show letters when not playing
            input.attr('value', word.word[l-first])
            input.attr('readonly', 'readonly')
          }
        }
      }
    })
  }
  setMask()
}
