module.exports = {
  register: ()=>{
    send('register-dictionary', dictionary, 'dictionaryregistered')
  },
  update: ()=>{
    if($('#class').val() == '')
      box(datalanguage['alert'], datalanguage['selectclass'])
    else
      send('update-dictionary', dictionary, 'dictionaryupdated')
  },
  remove: ()=>{
    this_dictionary = $('#dictionary').val()
    if($('#class').val() == '')
      box(datalanguage['alert'], datalanguage['selectclass'])
    else if(this_dictionary == '')
      box(datalanguage['alert'], datalanguage['selectdictionary'])
    else
      box(datalanguage['confirm'], datalanguage['askremove'],function(){
        send('delete-dictionary', this_dictionary, 'dictionarydeleted')
      })

  },
  showDictionaryPanel: (action)=>{
    $('<div/>', {'class': 'panel', 'id': 'dictionaryPanel', 'style': 'height:'+($(window).height()-100)+'px'}).appendTo($('body'))
    dictionary = {'name': '', 'class': '', 'words': [ {'word': '', 'text': '', 'level': 0} ]}
    if(action == 'new'){
      showDictionaryFields()
    }else if(action == 'change'){
      $('<div/>', {'id': 'Function'}).hide().html('change').appendTo($('body'))
      listClasses()
    }
    else if(action == 'remove'){
      $('<div/>', {'id': 'Function'}).hide().html('remove').appendTo($('body'))
      listClasses()
    }
  }
}

function showDictionaryFields(){
  $('#fields').remove()
  fields = $('<div/>', {'id': 'fields'}).appendTo($('#dictionaryPanel'))
  $('<span/>').text(datalanguage['name']+': ').appendTo(fields)
  $('<input/>', {'id': 'name', 'maxlength': systemConfig.max_name_length, 'class': 'lettersAndNumbers', 'value': dictionary['name']}).appendTo(fields).keyup(function(){
    dictionary['name'] = $(this).val()
  })
  $('<br>').appendTo(fields)
  if(!$('#class').val()){
    $('<span/>').html(datalanguage['class']+': ').appendTo(fields)
    $('<select/>', {'id': 'class'}).appendTo(fields).change(function(){
      dictionary.class = this.value
    })
    $('<option/>').attr('value', '').text(datalanguage['select']).appendTo($('#class'))
    classPanel.classesSelect($('#class'), dictionary.class)
    $('<br>').appendTo(fields)
  }
  $('<br>').appendTo(fields)
  $('<div/>', {'id': 'words'}).appendTo(fields)
  w=0
  dictionary.words.forEach( (word, i)=>{
    addWordToPanel(word, i)
  })

  $('<input/>', {'type': 'button', 'class': 'addword'}).attr('value', datalanguage['add']).appendTo(fields).click(function(){
    addWordToPanel({'word': '', 'text': ''})
    $('#word-'+w).focus()
  })
  setMask()
}

function listClasses(){
  $('<span/>').html(datalanguage['class']+': ').appendTo($('#dictionaryPanel'))
  $('<select/>', {'id': 'class'}).appendTo($('#dictionaryPanel')).change(function(){
    dictionary.class = this.value
  }).change(function(){
    listDictionaries($(this).val())
  })
  $('<option/>').attr('value', '').text(datalanguage['select']).appendTo($('#class'))
  classPanel.classesSelect($('#class'), dictionary.class)
}

function getDictionary(name, callback){
  ipcRenderer.send('get-dictionary', {"name": name, "class": $('#class').val()} )
  ipcRenderer.once('get-dictionary', (event, this_dictionary)=>{
    callback(this_dictionary)
  })
}

function listDictionaries(classe){ //used to create/change dictionaries
  $('#dictionaries').remove()
  dictionaries = $('<div/>', {'id': 'dictionaries'}).appendTo($('#dictionaryPanel'))
  $('<span/>').html(datalanguage['dictionary']+': ').appendTo(dictionaries)
  $('<select/>', {'id': 'dictionary'}).appendTo(dictionaries)
  if($('#Function').text() == 'change')
    $('#dictionary').change(function(){
      if($('#name').val()){
        box(datalanguage['confirm'], datalanguage['losechanges'], () => {
          if($('#dictionary').val())
            getDictionary($("#dictionary option:selected" ).text(), (this_dictionary)=>{
              dictionary = this_dictionary
              dictionary.oldname = $("#dictionary option:selected" ).text()
              showDictionaryFields()
              $('#class').attr('disabled', 'disabled')
            })
          else{
            $('#fields').remove()
            $('#class').prop("disabled", false)
          }
        })
      }else
        getDictionary($("#dictionary option:selected" ).text(), (this_dictionary)=>{
          dictionary = this_dictionary
          dictionary.oldname = $("#dictionary option:selected" ).text()
          showDictionaryFields()
          $('#class').attr('disabled', 'disabled')
        })
    })
  $('<br/>').appendTo(dictionaries)
  ipcRenderer.send('list-dictionaries', classe)
  ipcRenderer.once('list-dictionaries', (event, list) => {
      $('<option/>').attr('value', '').text(datalanguage['select']).appendTo($('#dictionary'))
      list.forEach( (element) => {
          op = $('<option/>').attr('value', element.id).text(element.name).appendTo($('#dictionary'))
      })
      //sorting boards
      $('#dictionary').children('option').sort( (a, b) => {
        if($(b).val()){
          var upA = $(a).text().toUpperCase();
          var upB = $(b).text().toUpperCase();
          return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
        }
      }).appendTo($('#dictionary'))
      $("#dictionary").val('').prop("selected", true);
  })
}

function addWordToPanel(word){

  w++
  word.number = w
  tr = $('<div/>', {'id': 'fields-'+w}).appendTo($('#words'))
  $('<span/>').html(datalanguage['word']+' '+w+' ').appendTo(tr)
  $('<input/>', {'id': 'word-'+w, 'data-num': w, 'maxlength': systemConfig.board_config.max_size, 'value': word.word, 'class': 'letters'}).appendTo(tr).focusout(function(){
    num = $(this).data('num')
    updateWord(num)
  })
  $('<span/>').html('&nbsp;&nbsp;').appendTo(tr)
  $('<input/>', {'id': 'removeword', 'type': 'button', 'value': ' - ', 'data-num': w}).appendTo(tr).click(function(){
    box(datalanguage['confirm'], datalanguage['askremoveword'], () => {
      $('#fields-'+$(this).data('num')).remove()
      index = dictionary.words.findIndex(x => x.number === $(this).data('num'))
      if(index > -1)
        dictionary.words.splice(index, 1);
    })
  })
  $('<br>').appendTo(tr)
  $('<span/>').html(datalanguage['clue']+' ').appendTo(tr)
  $('<input/>', {'id': 'clue-'+w, 'data-num': w, 'maxlength': systemConfig.max_clue_length, 'value': word.text, 'style': 'width:90%'}).appendTo(tr).focusout(function(){
    num = $(this).data('num')
    updateWord(num)
  })
  $('<br>').appendTo(tr)
  $('<span/>').html(datalanguage['level']+' ').appendTo(tr)
  $('<select/>', {'id': 'level-'+w, 'data-num': w, 'value': word.level}).appendTo(tr).focusout(function(){
    num = $(this).data('num')
    updateWord(num)
  })
  $('<option/>', {'value': 0}).text(datalanguage['easy']).appendTo($('#level-'+w))
  $('<option/>', {'value': 1}).text(datalanguage['medium']).appendTo($('#level-'+w))
  $('<option/>', {'value': 2}).text(datalanguage['hard']).appendTo($('#level-'+w))
  if(word.level != undefined)
    $('#level-'+w).val(word.level)
  else
    updateWord(w)
  $('<br>').appendTo(tr)
  $('<br>').appendTo(tr)
  setMask()
}

function updateWord(num){
  change = dictionary.words.findIndex(x => x.number === num)
  this_word = {"word": $('#word-'+num).val(), "text": $('#clue-'+num).val(), "number": num, "level": $('#level-'+num).val()}
  if(change == -1){
    dictionary.words.push(this_word)
  }else
    dictionary.words[change] = this_word
}
