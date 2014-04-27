var COOKIE_SCORE = 'wordPuzzleBestScore';
var COOKIE_LEVEL = 'wordPuzzleLevel';
var DEFAULT_LANGUAGE = 'en';

var GRID_SIZE_MIN = 5;
var GRID_SIZE_FACTOR = 5;
var LEVEL_MAX = 14;

var validColor = '#89E894';
var highlightColor = '#FFEF00'; 

var words = new Array();
var selectionInProgress = false;
var crtWord = '';
var crtSelectedCells = new Array();
var selectedCells = new Array();
var time = 0;
var score = 0;
var bestScore = 0;
var heightTimeUnit = 0;
var level = 0;
var gLanguage = DEFAULT_LANGUAGE;

var timerInterval;

var maxLevel = 14;

function getUrlParameters()
{
    var result = [];

    var query = window.location.search;
    query = query.replace('?', '');

    var pairs = query.split('&');      
    for (var i = 0; i < pairs.length; i++)
    {
        var pair = pairs[i].split('=');
        if (pair.length == 1)
        {
            result[pair[0]] = '';
        }
        else if (pair.length > 1)
        {
            result[pair[0]] = pair[1];
        }                
    }
    
    return result;
}

function setLanguage(language)
{
    gLanguage = language;
}

function getCookieValue(cookieName, defaultValue)
{
    var result = defaultValue;
    
    var cookieNameByLanguage = cookieName + '_' + gLanguage;
    if (docCookies.hasItem(cookieNameByLanguage))
    {
        result = docCookies.getItem(cookieNameByLanguage);
    }
    
    return result;
}

function setCookieValue(cookieName, cookieValue)
{
    var cookieNameByLanguage = cookieName + '_' + gLanguage;
    docCookies.setItem(cookieNameByLanguage, cookieValue, Infinity);
}

function initGrid()
{
    // register cell events
    $('#tblGrid').find('td')
        .mousedown(function() {
            startSelection();
            letterSelection($(this)[0]);
        })
        .mouseover(function() {
            letterSelection($(this)[0]);
        })
        .mouseup(function() {
            endSelection();
        });

    $('#tblGrid').find('td').each(function(index, element) {
            $(element).attr('id', index);
        });   

    // set score   
    bestScore = getCookieValue(COOKIE_SCORE, 0);
    $('#bestScore').text(bestScore);

    // set level
    level = getCookieValue(COOKIE_LEVEL, 0);
    if (level == LEVEL_MAX)
    {
        level = 0;
    }    
    $('#level').text(level);

    // calculate time for the current value and set timer accordingly
    time = words.length * (LEVEL_MAX - level);
    timerInterval = window.setInterval(function() { updateTime(); }, 1000);   
 
    $('#imgHeader').css('width', $('#tblGrid').css('width'));
    $('#divTimer').css('height',  $('#tblGrid').css('height'));
    heightTimeUnit = parseInt($('#tblGrid').css('height').replace('px', '')) / time;    
}

function updateTime()
{
    time--;
    $('#divTimer').css('height', parseInt(time * heightTimeUnit));

    if (time == 0)
    {
      gameOver();
    }
}

function gameOver()
{
    // save new high score only on level completed successfully
    if (words.length == 0)
    {
        // save best score    
        if (score > bestScore)
        {
            setCookieValue(COOKIE_SCORE, score);
            $('#bestScore').text(score);
        }

        // update level
        level++;
        if (level < LEVEL_MAX)
        {
            setCookieValue(COOKIE_LEVEL, level);
            $('#divResults')[0].innerHTML = 'Level completed. <a href="javascript:location.reload()">Go to next level</a>';        
        }
        else
        {
            // reset level if game completed
            setCookieValue(COOKIE_LEVEL, 0);
            $('#divResults')[0].innerHTML = 'Congratulations! You reached the end of the game!  <a href="javascript:location.reload()">Start again ?</a>';
        }

        // play sound
        var objAudio = document.getElementById("audioSuccess");
        objAudio.play();
    }
    else
    {
        $('#divResults')[0].innerHTML = 'Time\'s up! Keep calm and <a href="javascript:location.reload()">try again</a>';
        var objAudio = document.getElementById("audioFail");
        objAudio.play();
    }
    
    // stop timer
    window.clearInterval(timerInterval);

    // unbind cell events
    $('#tblGrid').find('td').unbind('mousedown mouseover');
    $('#tblGrid').unbind('mousedown mouseover mouseup');
}

function clearSelection()
{	
    for (var i = 0; i < crtSelectedCells.length; i++)
    {
        if (selectedCells.indexOf(crtSelectedCells[i]) < 0)
        {
            crtSelectedCells[i].style.backgroundColor = '';
        }
        else
        {
            crtSelectedCells[i].style.backgroundColor = validColor;
        }
    }
}

function markValidWord()
{	
    for (var i = 0; i < crtSelectedCells.length; i++)
    {
        crtSelectedCells[i].style.backgroundColor = validColor;
    }
}

function startSelection()
{		
    selectionInProgress = true;
}

function endSelection()
{	    
    selectionInProgress = false;	

    var crtIndex = words.indexOf(crtWord);
    if (crtIndex > -1) // a valid word has been selected
    {
        // calculate score
        score += (crtWord.length * 10);
        $('#score').text(score);

        // mark word as selected
        words.splice(crtIndex, 1);
        $("li:contains('" + crtWord + "')").css('text-decoration', 'line-through');
        for (var i = 0; i < crtSelectedCells.length; i++)
        {
            selectedCells.push(crtSelectedCells[i]);
        }
        markValidWord();

        // check if all words have been found
        if (words.length == 0)
        {
            gameOver();
        }
    }
    else
    {
        clearSelection();	
    }

    // reset current selection variables
    crtWord = '';	
    crtSelectedCells = [];
}

function letterSelection(cell)
{		
    if (selectionInProgress)
    {			
        if (crtSelectedCells.length >= 2)
        {
            var prev2 = parseInt(crtSelectedCells[crtSelectedCells.length - 2].id);
            var prev1 = parseInt(crtSelectedCells[crtSelectedCells.length - 1].id);
            var crt = parseInt(cell.id);
            var diffPrev = prev1 - prev2;
            var diffCrt = crt - prev1;

            if (diffCrt == diffPrev)
            {
                crtSelectedCells.push(cell);
                crtWord += cell.textContent;	

                cell.style.backgroundColor = highlightColor;	
            }
            else if (Math.abs(diffCrt) == Math.abs(diffPrev)) // go back
            {
                crtSelectedCells[crtSelectedCells.length - 1].style.backgroundColor = '';
                crtSelectedCells.splice(crtSelectedCells.length - 1, 1);
                
                crtWord = crtWord.slice(0, crtSelectedCells.length);	
            }
            else
            {
                endSelection();
            }
        }
        else
        {
            crtSelectedCells.push(cell);
            crtWord += cell.textContent;	

            cell.style.backgroundColor = highlightColor;	
        }
    }
}

function pickWords(dictionary, count)
{
    var result = new Array();    
    var tmpWord = '';
    
    var selectedWords = new Array();
    for(var i = 0; i < count; i++)
    {
        var position = getRandom(dictionary.length);
        while(true)
        {            
            tmpWord = dictionary[position].toUpperCase();
            if (result.indexOf(tmpWord) < 0)
            {
                break;
            }
           position = getRandom(dictionary.length);        
        }
        result.push(tmpWord);
    }
    
    return result;
}

function generateTable()
{	
    // get number of words per grid
    var wordCount = Math.max(GRID_SIZE_MIN, parseInt(Math.random() * 10) % 10);
    

    switch(gLanguage.toUpperCase())
    {
        case 'EN':
            words = pickWords(dictionaryEN, wordCount);
            break;
        case 'RO':
            words = pickWords(dictionaryRO, wordCount);
            break;
        case 'FR':
            words = pickWords(dictionaryFR, wordCount);
            break;            
            
        default:
            words = pickWords(dictionaryEN, wordCount);
            break;
    }
    
    // set gridSize
    var gridSize = 0;
    for (var i = 0; i < words.length; i++)
    {
        gridSize = Math.max(words[i].length, gridSize);
    }
    gridSize += GRID_SIZE_FACTOR;
    
    var matrixLetters = new Array();
    for(var i = 0; i < gridSize; i++)
    {
        var line = new Array();
        for(var k = 0; k < gridSize; k++)
        {
            line.push(' ');
        }
        matrixLetters.push(line);
    }

    var rows = new Array();
    for (var i = 0; i < words.length; i++)
    {		
        $('#lstWords').append('<li>' + words[i].toUpperCase() + '</li>');

        var row = '';	
        var word = words[i];
        var isHorizontal = getRandom(2) % 2;

        var startPos = getRandom(gridSize - word.length);  
        var matrixLine = getRandom(gridSize);
        while(true)
        {
            var isEmpty = true;        
            for (var k = 0; k < word.length; k++)
            {
                var crtCell = isHorizontal ? matrixLetters[matrixLine][startPos + k] : matrixLetters[startPos + k][matrixLine];
                if (crtCell != ' ')
                {
                    isEmpty = false;
                    break;
                }
            }
            if (isEmpty)
            {
                break;
            }
            startPos = getRandom(gridSize - word.length);  
            matrixLine = getRandom(gridSize);
        }
            
        for (var  k = 0; k < word.length; k++)
        {
            if (isHorizontal)
            {
                matrixLetters[matrixLine][startPos + k] = word[k].toUpperCase();
            }
            else
            {
                matrixLetters[startPos + k][matrixLine] = word[k].toUpperCase();
            }
        }      
    }

    for (var i = 0; i < gridSize; i++)
    {
        var row = '<tr>';
        for (var k = 0; k < gridSize; k++)
        {
            if (matrixLetters[i][k] != ' ')
            {
                row += '<td>' + matrixLetters[i][k] + '</td>';
            }
            else
            {
                row += '<td>' +  alphabet[getRandom(alphabet.length)] + '</td>';
            }
        }
        row += '</tr>';

        $('#tblGrid').append(row);
    }
}	

function getRandom(max)
{
    return Math.floor(Math.random() * max);
}
