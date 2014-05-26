var boardCanvas = document.getElementById("board")
var movesTable = document.getElementById("moves")

var difficulty = 0          // difficulty: should be a positive number
var my_player = 0           // player controlled by user (0: blue, 1: red)
var winning_set = null      // list of connected cells that form a winning set
var moves = []              // list of moves played so far
var color = {}              // colors for fields (+1: blue, -1: red)
var root = {}               // disjoint-set root for each field
var sideset = {}            // bitmask of connected sides for root fields

initialize()

function initialize()
{
    for (var i in fields) {
        sideset[i] = 0
        root[i] = i
    }
    for (var i in sides) {
        for (var j in sides[i]) {
            sideset[sides[i][j]] |= 1<<i
        }
    }

    drawBoard()
}

function findRoot(id)
{
    if (root[id] != id) {
        root[id] = findRoot(root[id])
    }
    return root[id]
}

function mergeTrees(i, j)
{
    sideset[i] |= sideset[j]
    root[j] = root[i]
}

function findWinningSet(lastField)
{
    // Merge neighbours with matching colors:
    var i = findRoot(lastField)
    for (var n in neighbours[lastField]) {
        var n = neighbours[lastField][n]
        var j = findRoot(n)
        if (i != j && color[i] == color[j]) mergeTrees(i, j)
    }

    // Calculate captured corners:
    var corners = [ ]
    for (var n in sides) {
        var mask = (n == 0) ? (1 | 1 << sides.length-1) : (3 << n-1)
        for (var m in sides[n]) {
            id = findRoot(sides[n][m])
            if (color[id] == color[lastField] && (sideset[id] & mask) == mask && (sideset[id] & ~mask) != 0) {
                corners.push(id)
                break
            }
        }
    }
    if (corners.length*2 > sides.length) {
        var winning_set = []
        corners.sort()
        for (var i = 0; i < corners.length; ++i) {
            if (i == 0 || corners[i] != corners[i - 1]) {
                for (var id in root) {
                    if (findRoot(id) == corners[i]) winning_set.push(id)
                }
            }
        }
        return winning_set
    }
}

function resolveMouseCoordinates(event, element)
{
    var x = event.pageX, y = event.pageY
    do {
        x -= element.offsetLeft - element.scrollLeft
        y -= element.offsetTop - element.scrollTop
    } while ((element = element.offsetParent))
    return { x:x, y:y }
}

window.requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(cb){setTimeout(cb,100)}

function startGame()
{
    if (moves.length == 0)
    {
        document.getElementById("options").style.display = 'none'
        document.getElementById("moves").style.display = 'inline-block'
        difficulty = parseInt(document.getElementById("difficulty").value)
    }
}

function aiStarts()
{
    startGame()
    my_player = 1
    var ths = movesTable.getElementsByTagName("th")
    ths[0].appendChild(ths[1].firstChild)
    ths[1].appendChild(ths[0].firstChild)
    playMove(getAiMove(0, difficulty))
}

function playMove(move)
{
    startGame()

    var field = move == "-1" ? moves[0] : move
    var player = moves.length%2
    moves.push(move)
    color[field] = 1 - 2*player

    var tr
    if (player == 0) {
        tr = document.createElement('tr')
        movesTable.appendChild(tr)
    } else {
        tr = movesTable.lastChild
    }
    var td = document.createElement('td')
    td.appendChild(document.createTextNode(move))
    tr.appendChild(td)
    movesTable.parentElement.scrollTop = movesTable.parentElement.scrollHeight

    animateField(field,
        function(dt) {
            var x = parseInt(Math.max(0, 255*(1 - dt)))
            return 'rgb('+(player%2?255:x)+','+x+','+(player%2?x:255)+')'
        },
        function() {
            winning_set = findWinningSet(field)
            if (winning_set) {
                animateWinningSet(winning_set, player)
            } else if (player == my_player) {
                playMove(getAiMove(move, difficulty))
            }
        })
}

boardCanvas.onclick = function(event) {

    if (winning_set || moves.length%2 != my_player) return  // not my turn

    var xy = resolveMouseCoordinates(event, boardCanvas)
    var context = boardCanvas.getContext('2d')
    for (var id in fields) {
        buildFieldPath(context, id)
        if (context.isPointInPath(xy.x, xy.y)) {
            if (moves.length == 1 && id == moves[0]) {
                playMove("-1")
            } else {
                var i = 0
                while (i < moves.length && moves[i] != id) ++i
                if (i == moves.length) {
                    playMove(id)
                }
            }
        }
    }
}

function buildFieldPath(context, i)
{
    context.beginPath()
    for (var j in fields[i].perimeter) {
        context.lineTo( 250 + 35*(15*fields[i].perimeter[j].x + fields[i].x)/16,
                        230 - 35*(15*fields[i].perimeter[j].y + fields[i].y)/16 )
    }
    context.closePath()
}

function animateField(field, fillFunction, callback)
{
    var start = new Date().getTime()/1000
    var context = boardCanvas.getContext('2d')

    function render() {
        var dt = new Date().getTime()/1000 - start
        buildFieldPath(context, field)
        context.fillStyle = fillFunction(dt)
        context.fill()

        context.font = 'bold 15px sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillStyle = 'white'
        context.fillText(field, 250 + 35*fields[field].x,
                                230 - 35*fields[field].y)

        if (dt < 1) {
            requestAnimationFrame(render)
        } else if (callback) {
            callback()
        }
    }

    render()
}

function animateWinningSet(winning_set, player)
{
    var fillFunction = function(dt) {
        var x = parseInt(Math.max(0, (dt < 0.5) ? 2*dt : 1 - 2*(dt - 0.5))*255)
        return 'rgb('+(player%2?255:x)+','+x+','+(player%2?x:255)+')'
    }
    for (var i in winning_set) {
        animateField(winning_set[i], fillFunction)
    }
    setTimeout(function() { animateWinningSet(winning_set, player) }, 2500)
}

function drawBoard() {
    var context = boardCanvas.getContext('2d')
    context.clearRect(0, 0, boardCanvas.width, boardCanvas.height)

    context.beginPath()
    for (var i = 0; i < 5; ++i)
    {
        var a = i*Math.PI*2/5 + Math.PI/2;
        context.lineTo( 250 + 230*Math.cos(a),
                        230 - 230*Math.sin(a) )
    }
    context.closePath()
    context.fillStyle = 'black'
    context.fill()

    context.fillStyle = 'white'
    for (var i in fields)
    {
        buildFieldPath(context, i)
        context.fill()
    }

    context.font = 'bold 15px sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillStyle = 'black'
    for (var i in fields)
    {
        context.fillText(i, 250 + 35*fields[i].x,
                            230 - 35*fields[i].y)
    }
}
