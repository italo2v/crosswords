module.exports = {
  generate: (dictionary, level, boardConfig) => {

      if(level == 0)
        max_words = boardConfig.random_easy_words
      else if(level == 1)
        max_words = boardConfig.random_medium_words
      else if(level == 2)
        max_words = boardConfig.random_hard_words
      else if(level == 3)
        max_words = boardConfig.random_mixed_words

      board = {
        "name": "#random#",
        "class": "",
        "level": level,
        "width": boardConfig.random_cols,
        "height": boardConfig.random_rows,
        "locale": "",
        "across": [],
        "down": []
      }
      words = []
      table = []
      dic = []
      word_count = []

      for(w=0;w<dictionary.length;w++){

        //remove repeated words
        abt = 0
        for(wt=0;wt<dic.length;wt++)
          if(dictionary[w].word == dic[wt].word)
            abt = 1

        if(abt == 0)
          //select words of according level
          if(level == 0 && dictionary[w].level == 0)
            dic.push(dictionary[w])
          else if(level == 1 && dictionary[w].level == 1)
            dic.push(dictionary[w])
          else if(level == 2 && dictionary[w].level == 2)
            dic.push(dictionary[w])
          else if(level == 3)
            dic.push(dictionary[w])
      }

      if(dic.length == 0)
        return board

      //generating random word
      for(w=1;w<=max_words;w++){
        previous_char_pos = -1
        word = {"word": ""}
        char = ''

        if(w == 1){
            random = -1
            for(nw=1;nw<=dic.length;nw++){
              if(word.word.length < 5)
                randomWord(dic)
            }

            word.first = [1,1]
            if(random % 2)
              word.direction = 'down'
            else
              word.direction = 'across'

            if(level == 3)
              word_count[word.level] = 1
        }else{
            list_words = []
            for(l=1;l<words.length;l++)
              list_words.push(l)
            while(list_words.length > 0){
            wl = Math.floor(Math.random() * list_words.length)
            word_match = list_words[wl]
            list_words.splice(wl, 1)
            //for(word_match = w-1;word_match > 0;word_match--){
              matchWord()
              if(!abort){
                if(level == 3){

                  if(typeof word_count[word.level] == "undefined")
                    word_count[word.level] = 1
                  else
                    word_count[word.level]++

                  if(word_count[word.level] <= boardConfig.mixed_max_words_level)
                    //console.log('word level: '+word.level)
                    //console.log('word count: '+word_count[word.level])
                    break
                  else
                    word_count[word.level] = boardConfig.mixed_max_words_level
                }else
                  break
              }
            }

            if(word_match == 0){
              word = {"word": ""}
              break
            }

        }

        if(word.word != ''){
          word.number = w
          word.previous_char_pos = previous_char_pos
          words[w] = word
          dic.splice(random, 1)
          //console.log(word)
        }
      }
      //console.log(w)
      //console.log(word_match)
      //console.log(words)
      //console.log(table)
      updateBoardSize()
      for(i=1;i<=words.length-1;i++){
        delete words[i].pos
        delete words[i].previous_char_pos
        if(words[i].direction == 'across'){
          board.across.push(words[i])
          delete words[i].direction
        }else if(words[i].direction == 'down'){
          board.down.push(words[i])
          delete words[i].direction
        }
      }

    return board
  }
}

function randomLetter(word){
  if(pos == -1)
    pos = Math.floor(Math.random() * word.length)
  else
    if(pos == word.length-1)
      pos = 0
    else
      pos++
  char = word.substring(pos, pos+1)
}

function randomWord(dic){
  if(random == -1)
    random = Math.floor(Math.random() * dic.length)
  else
    if(random == dic.length-1)
      random=0
    else
      random++
  word = dic[random]
}

function spaceAndCheckSizeWords(){
  word.first = [1, 1]
  if(words[word_match].direction == 'down'){
    word.direction = 'across'
    word.first = [words[word_match].first[0]+pos, words[word_match].first[1]-previous_char_pos]
    x = word.first[1]
    if(word.first[1]+word.word.length-1 > board.width){
      abort = true
      //console.log('checkSpace: '+words.word+' > preview width ')
    }else if(x <= 0){
      word.first[1] = word.first[1]-x+1
      if(word.first[1]+word.word.length-1 > board.width){
        abort = true
        //console.log('checkSpace: '+words.word+' > preview width ')
      }else for(i=w-1;i>=1;i--){
        words[i].first[1] = words[i].first[1]-x+1
        if(words[i].direction == 'across' && words[i].first[1]+words[i].word.length-1 > board.width){
          //console.log(words[i].word+' - '+(words[i].first[1]+words[i].word.length-1))
          for(r=i;r<w;r++)
            words[r].first[1] = words[r].first[1]+x-1
          abort = true
          //console.log('checkSpace: '+words[i].word+' > preview width ')
          break
        }else if(words[i].direction == 'down' && words[i].first[1] > board.width){
          //console.log(words[i].word+' - '+(words[i].first[1]))
          for(r=i;r<w;r++)
            words[r].first[1] = words[r].first[1]+x-1
          abort = true
          //console.log('checkSpace: '+words[i].word+' > preview width ')
          break
        }
      }
    }
  }
  else if(words[word_match].direction == 'across'){
    word.direction = 'down'
    word.first = [words[word_match].first[0]-previous_char_pos, words[word_match].first[1]+pos]
    y = word.first[0]
    if(word.first[0]+word.word.length-1 > board.height){
      abort = true
      //console.log('checkSpace: '+word.word+' > preview height ')
    }else if(y <= 0){
      word.first[0] = word.first[0]-y+1
      if(word.first[0]+word.word.length-1 > board.height){
        abort = true
        //console.log('checkSpace: '+word.word+' > preview height ')
      }else for(i=w-1;i>=1;i--){
        words[i].first[0] = words[i].first[0]-y+1
        if(words[i].direction == 'down' && words[i].first[0]+words[i].word.length-1 > board.height){
          //console.log(words[i].word+' - '+(words[i].first[0]+words[i].word.length-1))
          for(r=i;r<w;r++)
            words[r].first[0] = words[r].first[0]+y-1
          abort = true
          //console.log('checkSpace: '+words[i].word+' > preview height ')
          break
        }else if(words[i].direction == 'across' && words[i].first[0] > board.height){
          //console.log(words[i].word+' - '+(words[i].first[0]))
          for(r=i;r<w;r++)
            words[r].first[0] = words[r].first[0]+y-1
          abort = true
          //console.log('checkSpace: '+words[i].word+' > preview height ')
          break
        }
      }
    }
  }
  if(!abort)
    checkTouchWords()
}

function generateTable(){
    for(var i=1; i<=board.height; i++) {
        table[i] = [];
        for(var j=1; j<=board.width; j++) {
            table[i][j] = 0;
        }
    }

    for(i=1;i<words.length;i++){
      if(words[i].direction == 'across'){
        if(table[words[i].first[0]][words[i].first[1]-1] != undefined)
          table[words[i].first[0]][words[i].first[1]-1] = "#n"
        if(table[words[i].first[0]][words[i].first[1]+words[i].word.length] != undefined)
          table[words[i].first[0]][words[i].first[1]+words[i].word.length] = "#n"
      }
      else if(words[i].direction == 'down'){
        if(table[words[i].first[0]-1] != undefined)
          table[words[i].first[0]-1][words[i].first[1]] = "#n"
        if(table[words[i].first[0]+words[i].word.length] != undefined)
          table[words[i].first[0]+words[i].word.length][words[i].first[1]] = "#n"
      }
      for(l=0;l<words[i].word.length;l++){
        letter = words[i].word[l]
        if(words[i].direction == 'across'){
          if(table[words[i].first[0]-1] != undefined)
            if(table[words[i].first[0]-1][words[i].first[1]+l] == "#d")
              table[words[i].first[0]-1][words[i].first[1]+l] = "#n"
            else if(table[words[i].first[0]-1][words[i].first[1]+l] === 0)
              table[words[i].first[0]-1][words[i].first[1]+l] = "#a"
          table[words[i].first[0]][words[i].first[1]+l] = letter
          if(table[words[i].first[0]+1] != undefined)
            if(table[words[i].first[0]+1][words[i].first[1]+l] == "#d")
              table[words[i].first[0]+1][words[i].first[1]+l] = "#n"
            else if(table[words[i].first[0]+1][words[i].first[1]+l] === 0)
              table[words[i].first[0]+1][words[i].first[1]+l] = "#a"
        }else if(words[i].direction == 'down'){
          if(table[words[i].first[0]+l] != undefined && table[words[i].first[0]+l][words[i].first[1]-1] != undefined)
            if(table[words[i].first[0]+l][words[i].first[1]-1] == "#a")
              table[words[i].first[0]+l][words[i].first[1]-1] = "#n"
            else if(table[words[i].first[0]+l][words[i].first[1]-1] === 0)
              table[words[i].first[0]+l][words[i].first[1]-1] = "#d"
          table[words[i].first[0]+l][words[i].first[1]] = letter
            if(table[words[i].first[0]+l] != undefined && table[words[i].first[0]+l][words[i].first[1]+1] != undefined)
              if(table[words[i].first[0]+l][words[i].first[1]+1] == "#a")
                table[words[i].first[0]+l][words[i].first[1]+1] = "#n"
              else if(table[words[i].first[0]+l][words[i].first[1]+1] === 0)
                table[words[i].first[0]+l][words[i].first[1]+1] = "#d"
        }
      }
    }
}

function checkTouchWords(){
  generateTable()
  if(word.direction == 'across'){
    if(!( (table[word.first[0]][word.first[1]] === 0
          || table[word.first[0]][word.first[1]] == word.word[0]
          || table[word.first[0]][word.first[1]] == '#d')
    && (table[word.first[0]][word.first[1]-1] == undefined
        || table[word.first[0]][word.first[1]-1] === 0
        || table[word.first[0]][word.first[1]-1] == "#a"
        || table[word.first[0]][word.first[1]-1] == "#d"
        || table[word.first[0]][word.first[1]-1] == "#n") )){
      abort = true
      //console.log('checkTouch: '+word.word+' first char '+word.word[0]+' wrong position '+table[word.first[0]][word.first[1]])
    }
    else if(!( (table[word.first[0]][word.first[1]+word.word.length-1] === 0
                || table[word.first[0]][word.first[1]+word.word.length-1] == word.word[word.word.length-1]
                || table[word.first[0]][word.first[1]+word.word.length-1] == "#d")
    && (table[word.first[0]][word.first[1]+word.word.length] === 0
        || table[word.first[0]][word.first[1]+word.word.length] == undefined
        || table[word.first[0]][word.first[1]+word.word.length] == "#d"
        || table[word.first[0]][word.first[1]+word.word.length] == "#a"
        || table[word.first[0]][word.first[1]+word.word.length] == "#n") )){
      abort = true
      //console.log('checkTouch: '+word.word+' last char '+word.word[word.word.length-1]+' wrong position '+table[word.first[0]][word.first[1]+word.word.length-1])
    }
  }
  else if(word.direction == 'down'){
    if(!( (table[word.first[0]][word.first[1]] === 0
          || table[word.first[0]][word.first[1]] == word.word[0]
          || table[word.first[0]][word.first[1]] == "#a")
    && (table[word.first[0]-1] == undefined
        || table[word.first[0]-1][word.first[1]] === 0
        || table[word.first[0]-1][word.first[1]] == "#a"
        || table[word.first[0]-1][word.first[1]] == "#d"
        || table[word.first[0]-1][word.first[1]] == "#n") )){
      abort = true
      //console.log('checkTouch: '+word.word+' first char '+word.word[0]+' wrong position '+table[word.first[0]][word.first[1]])
    }
    else if(!( (table[word.first[0]+word.word.length-1][word.first[1]] === 0
                || table[word.first[0]+word.word.length-1][word.first[1]] == word.word[word.word.length-1]
                || table[word.first[0]+word.word.length-1][word.first[1]] == "#a")
    && (table[word.first[0]+word.word.length] == undefined
        || table[word.first[0]+word.word.length][word.first[1]] === 0
        || table[word.first[0]+word.word.length][word.first[1]] == "#a"
        || table[word.first[0]+word.word.length][word.first[1]] == "#d"
        || table[word.first[0]+word.word.length][word.first[1]] == "#n") )){
      abort = true
      //console.log('checkTouch: '+word.word+' last char '+word.word[word.word.length-1]+' wrong position '+table[word.first[0]+word.word.length-1][word.first[1]])
    }
  }

  if(!abort)
    for(l=0;l<word.word.length;l++){
      letter = word.word[l]
      if(word.direction == 'across'){
        if(!(table[word.first[0]][word.first[1]+l] == letter
           || table[word.first[0]][word.first[1]+l] === 0
           || table[word.first[0]][word.first[1]+l] == "#d")){
          abort = true
          //console.log('checkTouch: '+word.word+' char '+letter+' wrong position ')
          break
        }else
          table[word.first[0]][word.first[1]+l] = letter
      }else if(word.direction == 'down'){
        if(!(table[word.first[0]+l][word.first[1]] === 0
          || table[word.first[0]+l][word.first[1]] == letter
          || table[word.first[0]+l][word.first[1]] == "#a")){
          abort = true
          //console.log('checkTouch: '+word.word+' char '+letter+' wrong position ')
          break
        }else
          table[word.first[0]+l][word.first[1]] = letter
      }
    }

  if(abort){
    if(word.direction == 'across' && x <= 0){
      for(i=1;i<words.length;i++)
        words[i].first[1] = words[i].first[1]+x-1
    }
    else if(word.direction == 'down' && y <= 0){
      for(i=1;i<words.length;i++)
        words[i].first[0] = words[i].first[0]+y-1
    }
  }
}


function matchWord(){

  abort = true

    if(/*word_match == 1 || */words[word_match].word.length != 2 && !(words[word_match].word.length == 3 && words[word_match].previous_char_pos == 1)){
      pos = -1
      if(typeof words[word_match].pos == "undefined")
        words[word_match].pos = []
      for(c=1;c<=words[word_match].word.length&&abort;c++){
        randomLetter(words[word_match].word)
        if(char != '-' && char != ' ' && words[word_match].pos.indexOf(pos) == -1){
          random = -1
          for(nw=1;nw<=dic.length&&abort;nw++){
            randomWord(dic)
            if(word.word.includes(char)){
              previous_char_pos = word.word.indexOf(char)
              abort = false
              spaceAndCheckSizeWords()
              //console.log('match:'+word_match+' - '+word.word+' - '+words[word_match].pos+' - '+words[word_match].char+' - c:'+c)
            }
          }
          if(!abort)
            words[word_match].pos.push(pos)
        }
      }
    }

}

function updateBoardSize(){
  generateTable()
  coluna = []
  linha = []

  for(l=board.height;l>=1;l--)
    for(c=board.width;c>=1;c--)
      if(table[l][c] != 0 && table[l][c] != '#n' && table[l][c] != '#a' && table[l][c] != '#d'){
        linha[l] = 1
        coluna[c] = 1
      }

    board.height = linha.length-1
    board.width = coluna.length-1

}
