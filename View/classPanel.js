module.exports = {
  register: () => {
    classe = getFields()
    send('register-class', classe, 'classregistered')
  },

  remove: ()=> {
    classe_id = $('#name').val()
    if(classe_id == '')
      box(datalanguage['alert'], datalanguage['selectclass'])
    else
      box(datalanguage['confirm'], datalanguage['askremove'], () => {
        send('delete-class', {"class": classe_id, "locale": datalanguage['langLocale']}, 'classdeleted')
      })
  },
  showClassPanel: (action) => {
    $('<div/>', {'class': 'panel', 'id': 'classPanel', 'style': 'height:'+($(window).height()-100)+'px'}).appendTo($('body'))
    if(action == 'list')
      listClasses()
    else if(action == 'new')
      createClass()
    else if(action == 'remove')
      removeClass()
  },

  getClasses: () => {
    return new Promise(resolve => {
      ipcRenderer.send('list-classes', datalanguage['langLocale'])
      ipcRenderer.once('list-classes', (event, classes) => {
        var c=0
        pad = "00000"
        nivel={}
        arvore={"items": [], "subitems": []}
          classes.forEach( (element) => {
            if(element.parent == ''){
              c++
              order = padLeft(c)
              arvore['items'].push({"name": element.name, "num" : c, "order" : order, "id": element.id})
            }else{
              if(!nivel[element.parent])
                nivel[element.parent]=1
              else
                nivel[element.parent]++
              arvore['subitems'].push({"name": element.name, "parent": element.parent, "num": nivel[element.parent], "id": element.id})
            }
          })
          while(arvore.subitems.length > 0){
            arvore.subitems.forEach((item, i) => {
              for(p=0;p<arvore.items.length;p++){
                if(item.parent == arvore.items[p].id){
                  item.order = arvore.items[p].order+'-'+(padLeft(item.num))
                  item.num = arvore.items[p].num+'.'+item.num
                  arvore['items'].push({"name": item.name, "num": item.num, "order": item.order, "id": item.id})
                  arvore.subitems.splice(i, 1)
                  return
                }
              }
            })
          }
          resolve(arvore)
      })
    })
  },

  classesSelect: (appendTo, selected) => {
    module.exports.getClasses().then( (arvore) => {
        arvore.items.forEach((item, i) => {
          $('<option/>').attr('data-order', item.order).text(item.num+'- '+item.name).val(item.id).appendTo(appendTo)
        })
        //sorting classes
        appendTo.children('option').sort( (a, b) => {
          if($(b).val()){
            var upA = $(a).attr('data-order').toUpperCase();
            var upB = $(b).attr('data-order').toUpperCase();
            return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
          }
        }).appendTo(appendTo)
        appendTo.val(selected).prop("selected", true);
    })
  }

}

function padLeft(number){
  pad = "00000"
  number = number.toString()
  if(number.length >= pad.lenght)
    return number
  str = pad+number
  return str.substring(number.length, str.lenght)
}

function getFields(){
  classe = {
    "name": $('#name').val(),
    "parent": $('#parent').val(),
    "locale": datalanguage['langLocale']
  }
  return classe
}

function listClasses(){
  $('<div/>', {'id': 'listclasses'}).html('<b>'+datalanguage['listclasses']+'</b><br/>').appendTo($('#classPanel'))
  module.exports.getClasses().then( (arvore) => {
      arvore.items.forEach((item, i) => {
        $('<div/>').attr('data-order', item.order).text(item.num+'- '+item.name).appendTo($('#listclasses'))
      })
      //sorting classes
      $('#listclasses').children('div').sort( (a, b) => {
          var upA = $(a).attr('data-order').toUpperCase();
          var upB = $(b).attr('data-order').toUpperCase();
          return (upA < upB) ? -1 : (upA > upB) ? 1 : 0;
      }).appendTo($('#listclasses'))
  })
}

function createClass(){
  $('<span/>').html(datalanguage['name']+': ').appendTo('#classPanel')
  $('<input/>', {'id': 'name', 'class': 'lettersAndNumbers', 'maxlength': systemConfig.max_name_length}).appendTo('#classPanel')
  $('<br/>').appendTo($('#classPanel'))
  $('<span/>').html(datalanguage['subclassof']+': ').appendTo($('#classPanel'))
  $('<select/>', {'id': 'parent'}).appendTo($('#classPanel'))
  $('<option/>').attr('value', '').text(datalanguage['none']+' [*]').appendTo($('#parent'))
  module.exports.classesSelect($('#parent'), '')
  $('#name').focus()
  $('#classPanel input').keydown(function(){
    key = event.keyCode || event.charCode;
    if(key == 13) //enter
      if(!$('#box').html() && !$('#boxProfile').html())
        $('#register').click()
  })
  setMask()
}

function removeClass(){
  $('<span/>').html(datalanguage['name']+': ').appendTo('#classPanel')
  $('<select/>', {'id': 'name'}).appendTo('#classPanel')
  $('<option/>').attr('value', '').text(datalanguage['select']).appendTo('#name')
  module.exports.classesSelect($('#name'), '')
  $('#name').focus()
}
