
// coord lists

// from G coords to screen coords
var rowGtoS = [];
var colGtoS = [];

// From row name to [internal Y coordinate (G), screen Y coordinate]
var rowInfo = {};

// From column name to [internal X coordinate, screen X coordinate]
var colInfo = {};

var rowFromG = {}; // Look up the row name from the G coordinate
var colFromG = {}; // Look up the column name from the G coordinate

var rowFromS = {}; // Look up the row name from the Screen coordinate
var colFromS = {}; // Look up the column name from the Screen coordinate

function initNames()
{
    var fam = curBitstream.family;

    var cmaxG = 66 + (26 * (fam.cols-1));
    var rmaxG = 61 + (30 * (fam.rows-1));

    rowGtoS = [];
    colGtoS = [];

    var s = 4;
    for (var g = 0; g <= cmaxG; g++)
    {
        colGtoS[g] = s;
        s += 4;
    }

    s = 264 + ((fam.rows-1) * 120);
    for (var g = 0; g <= rmaxG; g++)
    {
        rowGtoS[g] = s;
        if (g == 2 || g == (rmaxG-3))
            s -= 12;
        else
            s -= 4;
    }

    colInfo = {};
    rowInfo = {};
    rowFromG = {};
    colFromG = {};
    rowFromS = {};
    colFromS = {};

    {
        var name = letters[0];
        var g = 0;

        colInfo['col.' + name + '.local.12'] = g++;
        colInfo['col.' + name + '.local.13'] = g; g+=11;
        colInfo['col.' + name + '.local.1'] = g++;
        colInfo['col.' + name + '.local.2'] = g++;
        colInfo['col.' + name + '.local.3'] = g++;
        colInfo['col.' + name + '.local.4'] = g++;
        colInfo['col.' + name + '.local.5'] = g++;
        colInfo['col.' + name + '.local.6'] = g++;
        colInfo['col.' + name + '.local.7'] = g++;
        colInfo['col.' + name + '.long.1'] = g++;
        colInfo['col.' + name + '.long.2'] = g++;
        colInfo['col.' + name + '.local.9'] = g++;
        colInfo['col.' + name + '.local.10'] = g++;
        colInfo['col.' + name + '.local.11'] = g; g+=2;
        colInfo['col.' + name + '.long.3'] = g++;
        colInfo['col.' + name + '.long.4'] = g++;
        colInfo['col.' + name + '.long.5'] = g++;
        colInfo['col.' + name + '.long.6'] = g;
    }

    for (var i = 1; i < fam.cols; i++)
    {
        var name = letters[i];
        var g = 43 + ((i-1) * 26);

        if (i != 1 && i != (fam.cols-1))
            colInfo['col.' + name + '.local.6'] = g;
        g++;
        colInfo['col.' + name + '.local.1'] = g++;
        colInfo['col.' + name + '.local.2'] = g++;
        colInfo['col.' + name + '.local.3'] = g++;
        colInfo['col.' + name + '.local.4'] = g++;
        colInfo['col.' + name + '.local.5'] = g; g+=2;
        colInfo['col.' + name + '.local.8'] = g; g+=3;
        colInfo['col.' + name + '.long.0'] = g; g+=2;
        colInfo['col.' + name + '.long.1'] = g++;
        colInfo['col.' + name + '.long.2'] = g++;
        colInfo['col.' + name + '.long.3'] = g++;
        colInfo['col.' + name + '.long.4'] = g;
    }

    {
        var name = letters[fam.cols];
        var g = 45 + ((fam.cols-1) * 26);

        colInfo['col.' + name + '.local.10'] = g; g+=3;
        colInfo['col.' + name + '.local.9'] = g++;
        colInfo['col.' + name + '.long.1'] = g++;
        colInfo['col.' + name + '.long.2'] = g++;
        colInfo['col.' + name + '.local.8'] = g++;
        colInfo['col.' + name + '.local.1'] = g++;
        colInfo['col.' + name + '.local.2'] = g++;
        colInfo['col.' + name + '.local.3'] = g++;
        colInfo['col.' + name + '.local.4'] = g++;
        colInfo['col.' + name + '.local.5'] = g; g+=9;
        colInfo['col.' + name + '.local.6'] = g++;
        colInfo['col.' + name + '.local.7'] = g;
    }

    {
        var name = letters[0];
        var g = rmaxG;

        rowInfo['row.' + name + '.local.11'] = g--;
        rowInfo['row.' + name + '.local.10'] = g; g-=4;
        rowInfo['row.' + name + '.local.1'] = g--;
        rowInfo['row.' + name + '.local.2'] = g--;
        rowInfo['row.' + name + '.local.3'] = g--;
        rowInfo['row.' + name + '.local.4'] = g--;
        rowInfo['row.' + name + '.local.5'] = g--;
        rowInfo['row.' + name + '.local.6'] = g--;
        rowInfo['row.' + name + '.long.1'] = g--;
        rowInfo['row.' + name + '.long.2'] = g--;
        rowInfo['row.' + name + '.local.7'] = g; g-=6;
        rowInfo['row.' + name + '.local.9'] = g; g-=2;
        rowInfo['row.' + name + '.local.8'] = g; g-=3;
        rowInfo['row.' + name + '.long.3'] = g;
    }

    for (var i = 1; i < fam.rows; i++)
    {
        var name = letters[i];
        var g = 53 + ((fam.rows-1-i) * 30);

        rowInfo['row.' + name + '.long.1'] = g--;
        rowInfo['row.' + name + '.local.0'] = g--;
        rowInfo['row.' + name + '.local.6'] = g--;
        rowInfo['row.' + name + '.local.1'] = g--;
        rowInfo['row.' + name + '.local.2'] = g--;
        rowInfo['row.' + name + '.local.3'] = g--;
        rowInfo['row.' + name + '.local.4'] = g--;
        rowInfo['row.' + name + '.local.5'] = g; g-=2;
        rowInfo['row.' + name + '.long.2'] = g;
    }

    {
        var name = letters[fam.rows];
        var g = 27;

        rowInfo['row.' + name + '.local.10'] = g; g-=3;
        rowInfo['row.' + name + '.long.1'] = g; g-=4;
        rowInfo['row.' + name + '.local.11'] = g; g-=3;
        rowInfo['row.' + name + '.local.9'] = g; g-=3;
        rowInfo['row.' + name + '.long.2'] = g--;
        rowInfo['row.' + name + '.long.3'] = g--;
        rowInfo['row.' + name + '.local.0'] = g--;
        rowInfo['row.' + name + '.local.8'] = g--;
        rowInfo['row.' + name + '.local.1'] = g--;
        rowInfo['row.' + name + '.local.2'] = g--;
        rowInfo['row.' + name + '.local.3'] = g--;
        rowInfo['row.' + name + '.local.4'] = g--;
        rowInfo['row.' + name + '.local.5'] = g; g-=5;
        rowInfo['row.' + name + '.local.6'] = g--;
        rowInfo['row.' + name + '.local.7'] = g;
    }

  // The e.g. DE.B entries
  for (let col = 0; col < fam.cols; col++)
  {
    for (let row = 0; row < fam.rows; row++)
    {
      const fullname = letters[row] + letters[col];

      const coloff = col * 26;

      if (col == 0)
      {
          colInfo[fullname] = 35;
          if (row == 0)
          {
              colInfo[fullname + '.A'] = 38;
              colInfo[fullname + '.A_2'] = 29;
              colInfo[fullname + '.EC'] = 28;
          }
          else
          {
              colInfo[fullname + '.A'] = 38;
              colInfo[fullname + '.EC'] = 35;
          }
          colInfo[fullname + '.DI'] = 21;
          colInfo[fullname + '.B'] = 22;
          colInfo[fullname + '.C'] = 23;
          colInfo[fullname + '.K'] = 24;
          if (row == fam.rows-1)
          {
              colInfo[fullname + '.E'] = 29;
              colInfo[fullname + '.D'] = 34;
              colInfo[fullname + '.RD'] = 21;
              colInfo[fullname + '.X'] = 62;
              colInfo[fullname + '.Y'] = 51;
          }
          else
          {
              colInfo[fullname + '.E'] = 32;
              colInfo[fullname + '.D'] = 36;
              colInfo[fullname + '.RD'] = 37;
              colInfo[fullname + '.X'] = 58;
              colInfo[fullname + '.Y'] = 51;
          }
      }
      else
      {
          colInfo[fullname] = coloff + 34;
          if (row == 0)
          {
              colInfo[fullname + '.EC'] = coloff + 27;
              colInfo[fullname + '.B'] = coloff + 28;
          }
          else
          {
              colInfo[fullname + '.EC'] = coloff;
              colInfo[fullname + '.B'] = coloff + 39;
          }
          colInfo[fullname + '.A'] = coloff + 37;
          colInfo[fullname + '.DI'] = coloff + 26;
          if (row == fam.rows-1)
          {
              colInfo[fullname + '.C'] = coloff + 25;
              colInfo[fullname + '.K'] = coloff + 28;
              colInfo[fullname + '.E'] = coloff + 27;
              colInfo[fullname + '.D'] = coloff + 26;
              colInfo[fullname + '.RD'] = coloff + 37;
              if (col != fam.cols-1)
              {
                  colInfo[fullname + '.X'] = coloff + 62;
                  colInfo[fullname + '.Y'] = coloff + 51;
              }
          }
          else
          {
              colInfo[fullname + '.C'] = coloff + 28;
              colInfo[fullname + '.K'] = coloff + 33;
              colInfo[fullname + '.E'] = coloff + 25;
              colInfo[fullname + '.D'] = coloff + 35;
              colInfo[fullname + '.RD'] = coloff + 36;
              if (col != fam.cols-1)
              {
                  colInfo[fullname + '.X'] = coloff + 58;
                  colInfo[fullname + '.Y'] = coloff + 51;
              }
          }
      }

      if (col == 0)
      {
          //colInfo[fullname + '.X_C'] = 33;
          colInfo[fullname + '.X_B'] = 58;
      }
      else if (col == fam.cols-1)
      {
          colInfo[fullname + '.I_C'] = coloff + 6;
          // Y_O coloff+41
          if (row == 0)
          {
              // TODO AJ.Y->P75
          }

          if (row != fam.rows-1)
              colInfo[fullname + '.X_O'] = coloff + 51;
          colInfo[fullname + '.Y_O'] = coloff + 48;
      }
      else
      {
          if (row == fam.rows-1)
              colInfo[fullname + '.X_B'] = coloff + 50;
          else
              colInfo[fullname + '.X_B'] = coloff + 58;
          colInfo[fullname + '.X_C'] = coloff + 6;
      }

      const rowoff = (fam.rows-1-row) * 30;

      rowInfo[fullname] = rowoff + 35;
        if (row == 0)
        {
            rowInfo[fullname + '.A'] = rowoff + 42;
            if (col == 0)
            {
                rowInfo[fullname + '.A'] = rowoff + 43;
                rowInfo[fullname + '.X_O'] = rowoff + 41;
                colInfo[fullname + '.Y_O'] = 42;
            }
            else if (col != fam.cols-1)
            {
                colInfo[fullname + '.Y_O'] = coloff + 41;
            }
        }
        else if (col == 0)
      {
          rowInfo[fullname + '.A'] = rowoff + 43;
          rowInfo[fullname + '.X_O'] = rowoff + 40;
      }
      else
      {
          rowInfo[fullname + '.A'] = rowoff + 40;
      }
      if (row == 0)
      {
          rowInfo[fullname + '.EC'] = rowoff + 40;
      }
      else
      {
          rowInfo[fullname + '.EC'] = rowoff + 41;
      }
        rowInfo[fullname + '.DI'] = rowoff + 34;
        rowInfo[fullname + '.B'] = rowoff + 32;
        rowInfo[fullname + '.C'] = rowoff + 31;
        rowInfo[fullname + '.K'] = rowoff + 29;
        rowInfo[fullname + '.E'] = rowoff + 28;
        rowInfo[fullname + '.X'] = rowoff + 33;
        rowInfo[fullname + '.Y'] = rowoff + 30;
        if (row == fam.rows-1)
        {
            rowInfo[fullname + '.D'] = rowoff + 25;
            rowInfo[fullname + '.EC'] = rowoff + 26;
        }
        else if (col == 0)
        {
            rowInfo[fullname + '.D'] = rowoff + 24;
            rowInfo[fullname + '.EC'] = rowoff + 26;
        }
        else
        {
            rowInfo[fullname + '.D'] = rowoff + 27;
            rowInfo[fullname + '.EC'] = rowoff + 24;
        }

        if (row != 0)
            rowInfo[fullname + '.Y_D'] = rowoff + 51;
        if (row != fam.rows-1)
            rowInfo[fullname + '.Y_A'] = rowoff + 22;
    }
  }

    // IOB entries
    // the pads are assigned clockwise from the leftmost top pad
    var pad = 1;

    for (var i = 0; i < fam.cols*2; i++)
    {
        var col = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (col == 0)
          base = 29 + (5*side);
        else if (col == (fam.cols-1))
          base = 32 + (11*side);
        else
          base = 31 + (7*side);
        base += (26 * col);

        colInfo[fullname] = base;
        rowInfo[fullname] = rmaxG - 2;

        colInfo[fullname + '.OK'] = base + 1;
        colInfo[fullname + '.IK'] = base + 3;
        colInfo[fullname + '.O'] = base + 1;
        colInfo[fullname + '.Q'] = base + 2;
        colInfo[fullname + '.I'] = base + 3;
        colInfo[fullname + '.T'] = base + 4;

        if (i == 0)
        {
          rowInfo[fullname+'.O'] = rmaxG - 10;
        }
        else if (i == (fam.cols*2 - 1))
        {
          // nothing on a row
        }
        else
        {
          rowInfo[fullname+'.O'] = rmaxG - 16 + (1*side);
          rowInfo[fullname+'.Q'] = rmaxG - 17 + (3*side);
          rowInfo[fullname+'.I'] = rmaxG - 18 + (5*side);
        }

        pad++;
    }

    for (var i = 0; i < fam.rows*2; i++)
    {
        var row = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (row == 0)
            base = 49 - (15*side);
        else if (row == (fam.rows-1))
            base = 43 - (21*side);
        else
            base = 43 - (9*side);
        base += (30 * (fam.rows-1-row));

        colInfo[fullname] = cmaxG - 7;
        rowInfo[fullname] = base;

        if (!side) base -= 2;
        rowInfo[fullname + '.IK'] = base - 1;
        rowInfo[fullname + '.OK'] = base - 3;
        rowInfo[fullname + '.I'] = base - 2;
        rowInfo[fullname + '.Q'] = base - 3;


        if (i == 0)
        {
            rowInfo[fullname + '.T'] = base - 1;
            rowInfo[fullname + '.O'] = base - 4;
            colInfo[fullname+'.O'] = cmaxG - 20;
        }
        else if (i == (fam.rows*2 - 1))
        {
            rowInfo[fullname + '.T'] = base - 1;
            rowInfo[fullname + '.O'] = base - 4;
            colInfo[fullname+'.O'] = cmaxG - 19;
        }
        else
        {
            rowInfo[fullname + '.T'] = base - 1 + (1*side);
            rowInfo[fullname + '.O'] = base - 4 - (1*side);
            colInfo[fullname+'.O'] = cmaxG - 23 + (5*side);
            colInfo[fullname+'.Q'] = cmaxG - 22 + (3*side);
            colInfo[fullname+'.I'] = cmaxG - 21 + (1*side);

            if (side) colInfo[fullname+'.O_X'] = cmaxG - 15;
        }

        pad++;
    }

    for (var i = fam.cols*2-1; i >= 0; i--)
    {
        var col = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (col == 0)
            base = 29 + (5*side);
        else if (col == (fam.cols-1))
            base = 32 + (6*side);
        else
            base = 31 + (7*side);
        base += (26 * col);

        colInfo[fullname] = base;
        rowInfo[fullname] = 3;

        colInfo[fullname + '.OK'] = base + 1;
        colInfo[fullname + '.IK'] = base + 3;
        colInfo[fullname + '.O'] = base + 1;
        colInfo[fullname + '.Q'] = base + 2;
        colInfo[fullname + '.I'] = base + 3;
        colInfo[fullname + '.T'] = base + 4;

        if (i == 0)
        {
            rowInfo[fullname+'.O'] = 20;
        }
        else if (i == (fam.cols*2 - 1))
        {
            rowInfo[fullname+'.O'] = 17;
        }
        else
        {
            rowInfo[fullname+'.O'] = 12 + (7*side);
            rowInfo[fullname+'.Q'] = 15 + (3*side);
            rowInfo[fullname+'.I'] = 16 + (1*side);
        }

        pad++;
    }

    for (var i = fam.rows*2-1; i >= 0; i--)
    {
        var row = i>>1;
        var side = i&1;
        var fullname = 'PAD'+pad;

        var base;
        if (row == 0)
            base = 50 - (15*side);
        else if (row == (fam.rows-1))
            base = 43 - (21*side);
        else
            base = 43 - (8*side);
        base += (30 * (fam.rows-1-row));

        colInfo[fullname] = 2;
        rowInfo[fullname] = base;

        if (!side) base -= 2;
        rowInfo[fullname + '.IK'] = base - 1;
        rowInfo[fullname + '.OK'] = base - 3;
        rowInfo[fullname + '.I'] = base - 2;

        if (i == 0)
        {
            rowInfo[fullname + '.T'] = base - 1;
            rowInfo[fullname + '.Q'] = base - 3;
            rowInfo[fullname + '.O'] = base - 4;
            colInfo[fullname+'.O'] = 17;
        }
        else if (i == (fam.rows*2 - 1))
        {
            rowInfo[fullname + '.T'] = base + 1;
            rowInfo[fullname + '.Q'] = base - 3;
            rowInfo[fullname + '.O'] = base - 4;
            colInfo[fullname+'.O'] = 29;
        }
        else
        {
            rowInfo[fullname + '.T'] = base - 1 + (1*side);
            rowInfo[fullname + '.Q'] = base - 3 - (2*side);
            rowInfo[fullname + '.O'] = base - 4 - (4*side);
            colInfo[fullname+'.O'] = 34 - (5*side);
            colInfo[fullname+'.Q'] = 33 - (3*side);
            colInfo[fullname+'.I'] = 32 - (1*side);
        }

        pad++;
    }

    console.log((pad-1)+' pads assigned');

    // TODO: pullups, TRI buffers, CLK inputs, ...
    // BCLKIN.I

    // 293G24 PU.KK.1.O
    // 293G44 PU.JK.2.O
    // 293G53 PU.JK.1.O
    // ..
    // 293G284 PU.BK.2.O
    // 293G293 PU.BK.1.O
    // 293G307 PU.AK.1.O

    rowInfo['GCLK.O_1'] = rmaxG - 20;
    rowInfo['GLCK.O_2'] = rmaxG - 13; // connection to PAD1.O
    rowInfo['ACLK.O'] = 4;

  // Make reverse tables
  Object.entries(rowInfo).forEach(([key, val]) => rowFromG[val[0]] = key);
  Object.entries(colInfo).forEach(([key, val]) => colFromG[val[0]] = key);
  Object.entries(rowInfo).forEach(([key, val]) => rowFromS[val[1]] = key);
  Object.entries(colInfo).forEach(([key, val]) => colFromS[val[1]] = key);
}

function getGCoords(name)
{
    name = name.split(':');
    var cname, rname;

    if (name.length == 1)
    {
        cname = name[0];
        rname = name[0];
    }
    else if (typeof colInfo[name[0]] != 'undefined' && typeof rowInfo[name[1]] != 'undefined')
    {
        cname = name[0];
        rname = name[1];
    }
    else if (typeof colInfo[name[1]] != 'undefined' && typeof rowInfo[name[0]] != 'undefined')
    {
        cname = name[1];
        rname = name[0];
    }
    else
        return undefined;

    return {x: colInfo[cname], y: rowInfo[rname]};
}

function getSCoords(name)
{
    var gc;
    if (typeof name == 'string')
        gc = getGCoords(name);
    else
        gc = name;

    if (typeof gc == 'undefined')
        return undefined;

    return {x: colGtoS[gc.x], y: rowGtoS[gc.y]};
}

  // Bit position starts for the tiles A through I. Note there is I/O before A and buffers between C-D and F-G.
  // FOR XC2018: bidi in D/G instead of C/F (along Y only?)
  // x 18 18 20 18 18 20 18 18
  // x 18 18 20 18 18 20 18 18 18 18
  var xTileStarts = [3, 21, 39, 59, 77, 95, 115, 133, 151, 169, 187];

  /**
   * Take a bit index and return the tile A-I, along with starting bitstream index.
   */
  function findTileX(x) {
    for (var i = 10; i >= 0; i--) {
      if (x >= xTileStarts[i]) {
        if (x < xTileStarts[i] + 18) {
          return ["ABCDEFGHIJK"[i], xTileStarts[i], i];
        } else {
          return ["buf", xTileStarts[i] + 18, -1];
        }
      }
    }
    return ["io", 0, -2];
  }

  // x 8 8 9 8 8 9 8 8
  // x 8 8 9 8 8 9 8 8 8 8
  var yTileStarts = [1, 9, 17, 26, 34, 42, 51, 59, 67, 75, 83];

  /**
   * Take a bit index and return the tile A-I, along with starting bitstream index.
   */
  function findTileY(y) {
    for (var i = 10; i >= 0; i--) {
      if (y >= yTileStarts[i]) {
        if (y < yTileStarts[i] + 8) {
          return ["ABCDEFGHIJK"[i], yTileStarts[i], i];
        } else {
          return ["buf", yTileStarts[i] + 8, -1];
        }
      }
    }
    return ["io", 0, -2];
  }
  

  class Pip {
    constructor(name, bitPt) {
      this.name = name;
      var parts = name.split(':');
      if (colInfo[parts[0]] == undefined || rowInfo[parts[1]] == undefined) {
        alert('undefined name ' + name);
      }
      this.screenPt = [colInfo[parts[0]][1], rowInfo[parts[1]][1]];
      if (this.screenPt[0] == 999 || this.screenPt[1] == 999) {
        alert('Undefined coord ' + name);
      }
      this.bitPt = bitPt;
      if (bitPt[0] >= 196 || bitPt[1] >= 87) {
        alert('Out of bounds bitstream index: ' + bitPt[0] + ',' + bitPt[1]);
      }
      this.state = 0;

    }

    draw(ctx) {
      if (this.bitPt[0] < 0 || this.state < 0) {
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
      } else if (this.state == 0) {
        ctx.strokeStyle = "gray";
        ctx.fillStyle = "white";
      } else if (this.state == 1) {
        ctx.strokeStyle = "red";
        ctx.fillStyle = "red";
      } else {
        // Shouldn't happen
        ctx.strokeStyle = "blue";
        ctx.fillStyle = "blue";
      }
      ctx.translate(-0.5,- .5); // Prevent antialiasing
      ctx.fillRect(this.screenPt[0] - 1, this.screenPt[1] - 1, 2, 2);
      ctx.translate(0.5, .5); // Prevent antialiasing
      ctx.beginPath();
      ctx.rect(this.screenPt[0] - 1, this.screenPt[1] - 1, 2, 2);
      ctx.stroke();
    }
  }


  // ROUTE TRACING STUFF
  var visStartPoint = '';
  var visPathInfo = [];
  var visDestList = [];
  var visStartPoint2 = '';
  var visPathInfo2 = [];
  var visDestList2 = [];

  /**
   * A switch matrix.
   * Name is e.g. HA.8.1
   * Coordinates: screenPt is the upper left corner of the box. gPt is the coordinate of pin 8.
   * LCA pin numbering is 1-8 with 1 in the upper left.
   * 
   */
  class Switch {
  constructor(name) {
    this.name = name;
    this.tilename = name[0] + name[1];
    this.num = parseInt(name[5], 10);
    this.pins = {}; // Dictionary holding names of pins

      // The switch pair's upper left wires are local.1
      var row = rowInfo['row.' + this.tilename[0] + '.local.1'];
      var col = colInfo['col.' + this.tilename[1] + '.local.1'];
      //console.log("CONSTRUCTOR: "+name+" -> "+col[0]+"G"+row[1]);
      if (this.tilename[0] == "K") {
        // The bottom switches are mirror-imaged, inconveniently.
        /*if (this.num == 1) {
          this.gPt = [col[0] + 3, row[0] + 1];
          this.screenPt = [col[1] - 2, row[1] + 6];
        } else {
          this.gPt = [col[0], row[0] - 2];
          this.screenPt = [col[1] - 2 + 8, row[1] + 6 - 8];
        }*/
        if (this.num == 1) {
          this.gPt = [col[0], row[0] - 2];
          this.screenPt = [col[1] - 2, row[1] + 6];
        } else {
          this.gPt = [col[0] + 3, row[0] + 1];
          this.screenPt = [col[1] - 2 + 8, row[1] + 6 - 8];
        }
      } else {
        if (this.num == 1) {
          this.gPt =[col[0], row[0] + 1]
          this.screenPt = [col[1] - 2, row[1] - 2];
        } else {
          this.gPt = [col[0] + 3, row[0] - 2];
          this.screenPt = [col[1] - 2 + 8, row[1] - 2 + 8];
        }
      }
      //console.log("CONSTRUCTOR: "+name+" -> "+this.gPt[0]+"G"+this.gPt[1]);
    }

  startDecode() {
    this.state = null;
    this.wires = [];
    this.connect = [];
    for (var i = 1; i <= 8; i++) this.connect[i] = false;
    this.coSwitches = [];
  }

  /**
   * Processes an entry from the configuration.
   */
  add(pin1, pin2) {
    assert(pin1 > 0 && pin1 <= 8, 'Bad switch pin ' + pin1);
    assert(pin2 > 0 && pin2 <= 8, 'Bad switch pin ' + pin2);
    //if (this.name=='IK.8.2') console.log("SW "+this.name+" WIRE "+pin1+"->"+pin2);
    this.wires.push([pin1, pin2]);
    this.connect[pin1] = true;
    this.connect[pin2] = true;
  }


  doConnect(side, sw)
  {
    //if (typeof sw != 'undefined') console.log("SWITCH "+this.name+" CONNECTING TO "+sw.name+" ON SIDE "+side);
    //else console.log("SWITCH "+this.name+" CONNECTING TO ??????? ON SIDE "+side);
    this.coSwitches[side] = sw;
  }

  connectPin(pin)
  {
    var chk = -1;

    switch (pin)
    {
      case 1: chk = 6; break;
      case 2: chk = 5; break;
      case 3: chk = 8; break;
      case 4: chk = 7; break;
      case 5: chk = 2; break;
      case 6: chk = 1; break;
      case 7: chk = 4; break;
      case 8: chk = 3; break;
    }

    return chk;
  }


  /**
   * Returns (x, y) screen coordinate for the pin.
   */
  pinCoord(pin) {
      return [this.screenPt[0] + [2, 6, 9, 9, 6, 2, 0, 0][pin - 1],
              this.screenPt[1] + [0, 0, 2, 6, 9, 9, 6, 2][pin - 1]];
  }

   /**
    * Draws the internal wire between pin1 and pin2.
    */
   drawWires(ctx) {
     ctx.beginPath();
     const self = this;
     ctx.strokeStyle = 'yellow';
     this.wires.forEach(function([pin1, pin2]) {
       var coord1 = self.pinCoord(pin1);
       var coord2 = self.pinCoord(pin2);
       ctx.moveTo(coord1[0], coord1[1]);
       ctx.lineTo(coord2[0], coord2[1]);
     });
     ctx.stroke();
     /*ctx.beginPath();
     ctx.strokeStyle = '#c80';
     for (var i = 1; i <= 8; i++)
     {
       if (!this.connect[i]) continue;

       var dodraw = false;
       var pincoord = this.pinCoord(i);
       var extent = [0,0];

       var cosw = this.coSwitches[(i-1)&6];
       var copin;
       if (typeof cosw != 'undefined')
       {
         copin = cosw.connectPin(i);
         if (cosw.connect[copin])
         {
           extent = cosw.pinCoord(copin);
           dodraw = true;
        }
       }

       if (dodraw)
       {
         ctx.moveTo(pincoord[0], pincoord[1]);
         ctx.lineTo(extent[0], extent[1]);
      }
     }
     ctx.stroke();*/
   }

   render(ctx) {
     this.drawWires(ctx);
   }
 
   // Helper to remove pins from switches along edges.
   /*
   skip(pin) {
     return ((this.tile.type == TILE.top && (pin == 0 || pin == 1)) || (this.tile.type == TILE.bottom && (pin == 4 || pin == 5)) ||
         (this.tile.type == TILE.left && (pin == 6 || pin == 7)) || (this.tile.type == TILE.right && (pin == 2 || pin == 3)));
   }
   */

    isInside(x, y) {
      return x >= this.screenPt[0] && x < this.screenPt[0] + 8 && y >= this.screenPt[1] && y < this.screenPt[1] + 8;
    }

    info() {
      return "Switch " + this.name + " " + this.state + " " + this.wires;
    }


    // route through a switch
    routeFromPin(pin)
    {
      var chk = [pin];
      var done = [];
      var ret = [];

      for (var i = 0; i < this.wires.length; i++) done[i] = false;

      for (var it = 0; it < 500; it++)
      {
        var chknext = [];
        for (var i = 0; i < this.wires.length; i++)
        {
          if (done[i]) continue;
          var w = this.wires[i];

          if (chk.indexOf(w[0]) != -1)
          {
            done[i] = true;
            chknext.push(w[1]);
            ret.push(w[1]);
          }
          if (chk.indexOf(w[1]) != -1)
          {
            done[i] = true;
            chknext.push(w[0]);
            ret.push(w[0]);
          }
        }
        if (chknext.length == 0) break;
        chk = chknext;
      }

      return ret;
    }

 }

  /**
   * Returns switch matrix point info: G coordinate and screen coordinate.
   * Name = e.g. HB.8.1.4
   * Returns e.g. ["28G29", 123, 234]
   */
  function getSwitchCoords(name) {
    const m = name.match(/([A-I][A-I])\.8\.(\d)\.(\d)$/);
    if (m == undefined) {
      throw "Bad name " + name;
    }
    const tilename = m[1];
    let switchNum = parseInt(m[2], 10);
    const pinNum = parseInt(m[3], 10);
    // The switch pair's upper left wires are local.1
    var row = rowInfo['row.' + tilename[0] + '.local.1'];
    var col = colInfo['col.' + tilename[1] + '.local.1'];
    let gPt; // G coordinate of the switch
    let screenPt // screen coordinate of the switch
    if (tilename[0] == "K") {
      // The bottom switches are mirror-imaged, inconveniently. So the Y values are swapped.
      if (switchNum == 1) {
        gPt =[col[0], row[0] - 2]
        screenPt = [col[1] - 2, row[1] - 2 + 8];
      } else {
        gPt = [col[0] + 3, row[0] + 1];
        screenPt = [col[1] - 2 + 8, row[1] - 2];
      }
    } else {
      if (switchNum == 1) {
        gPt =[col[0], row[0] + 1]
        screenPt = [col[1] - 2, row[1] - 2];
      } else {
        gPt = [col[0] + 3, row[0] - 2];
        screenPt = [col[1] - 2 + 8, row[1] - 2 + 8];
      }
    }
    // Calculate pin coords from the switch coords.
    const pinGpt = (gPt[0] + [0, 1, 2, 2, 1, 0, -1, -1][pinNum]) + "G" +
        (gPt[1] + [0, 0, -1, -2, -3, -3, -2, -1][pinNum]);

    return [pinGpt, screenPt[0] + [2, 6, 9, 9, 6, 2, 0, 0][pinNum],
            screenPt[1] + [0, 0, 2, 6, 9, 9, 6, 2][pinNum]];
  }

  /**
   * The RBT file is organized:
   * HH ... AH
   * .       .
   * HA ... AA
   * stored as rbtstream[line][char] of '0' and '1'.
   *
   * The die is organized:
   * AA ... AH
   * .       .
   * HA ... HH
   * This function flips the rbtstream to match the die, stored as bitstream[x][y].
   * bitstream also holds ints (not chars) and is inverted with respect to the bitstream, so 1 is active.
   * I'm using the term "bitstream" to describe the bitstream with the die's layout and "rbtstream" to describe the bitstream
   * with the .RBT file's layout.
   */
  function makeDiestream(rbtstream) {
    var bitstream = new Array(196);
    for (var x = 0; x < 196; x++) {
      bitstream[x] = new Array(87);
      for (var y = 0; y < 87; y++) {
        bitstream[x][y] = rbtstream[195 - x][86 - y] == '1' ? 0 : 1;
        
      }
    }
    return bitstream;
  }


  function fillText(ctx, text, x, y) {
    ctx.fillText(text, x + 0.5, y + 0.5);
  }

  function vtext(ctx, text, x, y) {
    for (var i = 0 ; i < text.length; i++) {
      fillText(ctx, text[i], x, y + 8 * i);
    }
  }

const SCALE = 2;

function __calcCoord(info, coord, num)
{
  num = parseInt(num);
  if (typeof coord[num] != 'undefined')
  {
    return info[coord[num]][1];
  }

  var n1 = num; while (typeof coord[n1] == 'undefined' && n1 > 0) n1--;
  var n2 = num; while (typeof coord[n2] == 'undefined' && n1 < 230) n2++;

  return (info[coord[n1]][1] + info[coord[n2]][1]) / 2;
}

function drawTextBox(ctx, text, x, y, w, h)
{
    ctx.strokeRect(x, y, w, h);

    let lines = text.split('\n');
    let ty = y+7;
    lines.forEach((l) =>
    {
        ctx.fillText(l, x+1, ty, w-2);
        ty += 10;
    });
}

function drawBackground(ctx)
{
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset

    var fam = curBitstream.family;

    var w = 272 + ((fam.cols-1) * 104);
    var h = 268 + ((fam.rows-1) * 120);
    var cx = 188 + (((fam.cols/2)-1) * 104);
    var cy = 168 + (((fam.rows/2)-1) * 120);

    var HEIGHT = h * SCALE;
    var WIDTH = w * SCALE;

    ctx.canvas.height = HEIGHT;
    ctx.canvas.width = WIDTH;
    $("#container").css('height', HEIGHT + 'px');
    $("#container").css('width', WIDTH + 'px');
    $("#info").css('margin-left', WIDTH + 'px');
    $("#info3").css('margin-left', WIDTH + 'px');
    $("#info3").css('clear', 'none');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(0.5, 0.5); // Prevent antialiasing
    ctx.scale(SCALE, SCALE);
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';

    // draw fixed elements

    ctx.strokeStyle = '#aaa';
    ctx.fillStyle = '#aaa';
    ctx.font = '8px Arial';

    drawTextBox(ctx, 'PWR\nDN', 12, 12, 20, 20);
    drawTextBox(ctx, 'VCC', 12, cy, 20, 20);
    drawTextBox(ctx, 'M1R\nD', 12, h-68, 20, 20);
    drawTextBox(ctx, 'M0R', 12, h-24, 20, 12);

    drawTextBox(ctx, 'GND', cx, 12, 20, 12);
    drawTextBox(ctx, 'GND', cx, h-24, 20, 12);

    drawTextBox(ctx, 'CCL\nK', w-32, 12, 20, 20);
    drawTextBox(ctx, 'VCC', w-32, cy, 20, 20);
    drawTextBox(ctx, 'DPG\nM', w-32, h-68, 20, 20);
    drawTextBox(ctx, 'RST', w-52, h-24, 20, 12);

    // draw background for programmable elements

    decoders.forEach(d => d.renderBackground(ctx));
}

  function drawLayout(ctx) {
    return;
    $("#img").css('opacity', 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    const HEIGHT = 824 * SCALE;
    const WIDTH = 824 * SCALE;
    ctx.canvas.height = HEIGHT;
    ctx.canvas.width = WIDTH;
    $("#container").css('height', HEIGHT + 'px');
    $("#container").css('width', WIDTH + 'px');
    $("#info").css('margin-left', WIDTH + 'px');
    $("#info3").css('margin-left', WIDTH + 'px');
    $("#info3").css('clear', 'none');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(0.5, 0.5); // Prevent antialiasing
    ctx.scale(SCALE, SCALE);
    $("#img").width(WIDTH);
    $("#img").height(HEIGHT);
    ctx.lineWidth = 1;
    ctx.lineCap = 'butt';
    // objects.forEach(o => o.draw(ctx));
    if (bitstreamTable) {
      decoders.forEach(d => d.render(ctx));
    }

    // ROUTING SHITO
    ctx.beginPath();
    ctx.strokeStyle = '#0f0';
    visPathInfo.forEach(function(w)
    {
      const sparts = w[0].split('G');
      const dparts = w[1].split('G');

      var sx = __calcCoord(colInfo, colFromG, sparts[0]);
      var sy = __calcCoord(rowInfo, rowFromG, sparts[1]);
      var dx = __calcCoord(colInfo, colFromG, dparts[0]);
      var dy = __calcCoord(rowInfo, rowFromG, dparts[1]);

      ctx.moveTo(sx, sy);
      ctx.lineTo(dx, dy);
    });
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#0ff';
    visPathInfo2.forEach(function(w)
    {
      const sparts = w[0].split('G');
      const dparts = w[1].split('G');

      var sx = __calcCoord(colInfo, colFromG, sparts[0]);
      var sy = __calcCoord(rowInfo, rowFromG, sparts[1]);
      var dx = __calcCoord(colInfo, colFromG, dparts[0]);
      var dy = __calcCoord(rowInfo, rowFromG, dparts[1]);

      ctx.moveTo(sx, sy);
      ctx.lineTo(dx, dy);
    });
    ctx.stroke();

    $("#settings").text(otherDecoder.info());
  }

/**
 * Renders a set of pips, specified in entries. Each entry is {"nGn": 0/1}.
 */
function pipRender(ctx, entries) {
  for (const [name, bit] of Object.entries(entries)) {
    //console.log("render PIP "+name);
    const parts = name.split('G');
    const row = rowFromG[parts[1]];
    const col = colFromG[parts[0]];
    if (row == undefined) {
      console.log('Undefined row', name, parts[1]);
      continue;
    }
    if (col == undefined) {
      console.log('Undefined col', name, parts[0]);
      continue;
    }
    const x = colInfo[col][1];
    const y = rowInfo[row][1];
    if (bit) {
      ctx.fillStyle = "gray";
      continue;
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fillRect(x-1, y-1, 3, 3);
  }

}

function drawPips(ctx, pips, color) {
  for (let i = 0; i < pips.length; i++) {
    const [gCoord, col, row, pipname, selected] = pips[i];
    if (selected) {
      ctx.fillStyle = "red";
    } else if (debug) {
      ctx.fillStyle = color;
    } else {
      continue;
    }
    ctx.fillRect(col - 1, row - 1, 3, 3);
  }
}


// Processes a click on the Layout image
function layoutMouse(x, y) {
  if (!debug) {
    return;
  }
  if (bitstreamTable == null) {
    // return;
  }
  x = Math.floor(x / SCALE);
  y = Math.floor(y / SCALE);
  const XOFF = 24;
  const YOFF = 30;
  const xmod = (x - XOFF) % 72;
  const ymod = (y - YOFF) % 72;
  let tilex = Math.floor((x - XOFF) / 72);
  let tiley = Math.floor((y - YOFF) / 72);
  tilex = Math.max(Math.min(tilex, 8), 0); // Clamp to range 0-8
  tiley = Math.max(Math.min(tiley, 8), 0); // Clamp to range 0-8
  const name = "ABCDEFGHIJK"[tiley] + "ABCDEFGHIJK"[tilex];
  let prefix = '';
  $("#info2").html("&nbsp;");
  $("#info3").html(prefix + name + ' ' + x + ' ' + y + '; ' + tilex + ' ' + xmod + ', ' + tiley + ' ' + ymod);
  let sw = switchDecoders.get(name + ".8.1");
  if (sw && sw.isInside(x, y)) {
    $("#info2").html(sw.info());
    return;
  }
  sw = switchDecoders.get(name + ".8.2");
  if (sw && sw.isInside(x, y)) {
    $("#info2").html(sw.info());
    return;
  }
  let iob = iobDecoders.getFromXY(x, y);
  if (iob) {
    $("#info2").html(iob.info());
    return;
  }
  // inside clb
  const clb = clbDecoders.get(name);
  if (clb && clb.isInside(x, y)) {
    $("#info2").html(clb.info());
    return;
  }
  const wire = isOnWire(x, y);
  if (wire) {
    $("#info2").html(wire);
    return;
  }
}

function isOnWire(x, y) {
  const result = [];
  const rowName = rowFromS[y];
  if (rowName) {
    result.push(rowName);
  }
  const colName = colFromS[x];
  if (colName) {
    result.push(colName);
  }
  if (result.length > 0) {
    return result.join(' ');
  }
}

function updateRoute()
{
  drawLayout($("#canvas")[0].getContext("2d"));

  var route1 = 'Route 1: &nbsp; ' + visStartPoint+' &nbsp; -&gt; &nbsp; ';
  if (visDestList.length > 0)
    route1 += visDestList.join(', ');
  else
    route1 += '(nothing)';

  var route2 = 'Route 2: &nbsp; ' + visStartPoint2+' &nbsp; -&gt; &nbsp; ';
  if (visDestList2.length > 0)
    route2 += visDestList2.join(', ');
  else
    route2 += '(nothing)';

  $('#routeinfo').html('<div style="color:#0f0;">'+route1+'</div><div style="color:#0ff;">'+route2+'</div>');
}

function layoutClick(x, y, btn) {
  removePopups();
  x = Math.floor(x / SCALE);
  y = Math.floor(y / SCALE);
  let col;
  let row;
  let colv;
  let rowv;
  Object.entries(colInfo).forEach(function([k, v]) {
    if (Math.abs(v[1] - x) < 3) {
      col = k;
      colv = v;
    }
  });
  Object.entries(rowInfo).forEach(function([k, v]) {
    if (Math.abs(v[1] - y) < 3) {
      row = k;
      rowv = v;
    }
  });
  if (rowv == undefined || colv == undefined) {
    $("#info0").html("");
  } else if (debug) {
    const gcoord = colv[0] + "G" + rowv[0];
    let pip = "";
    if (IobDecoders.gToName[gcoord]) {
      pip = IobDecoders.gToName[gcoord];
    }
    $("#info0").html(col + " " + row + " " + colv[0] + "G" + rowv[0] + "; " + colv[1] + "," + rowv[1] + " " + pip);
    console.log(col, row, colv[0] + "G" + rowv[0] + "; " + colv[1] + "," + rowv[1] + " " + pip);
    //console.log(iobDecoders.getFromPin(18));
  }

  // 56,56  60,66
  // 754,790 762,796
  if (x>=56 && x<=66 && y>=56 && y<=66)
  {
    const clk = clbDecoders.get('CLK.AA.I');
    if (clk && btn == 0)
    {
      clk.routeFromOutputs();
      visStartPoint = clk.startPoint;
      visPathInfo = clk.pathInfo;
      visDestList = clk.destList;
      visStartPoint2 = '';
      visPathInfo2 = [];
      visDestList2 = [];
      updateRoute();
    }
  }
  else if (x>=754 && x<=764 && y>=790 && y<=800)
  {
    const clk = clbDecoders.get('CLK.KK.I');
    if (clk && btn == 0)
    {
      clk.routeFromOutputs();
      visStartPoint = clk.startPoint;
      visPathInfo = clk.pathInfo;
      visDestList = clk.destList;
      visStartPoint2 = '';
      visPathInfo2 = [];
      visDestList2 = [];
      updateRoute();
    }
  }

  const XOFF = 24;
  const YOFF = 30;
  let tilex = Math.floor((x - XOFF) / 72);
  let tiley = Math.floor((y - YOFF) / 72);
  tilex = Math.max(Math.min(tilex, 10), 0); // Clamp to range 0-8
  tiley = Math.max(Math.min(tiley, 10), 0); // Clamp to range 0-8
  const name = "ABCDEFGHIJK"[tiley] + "ABCDEFGHIJK"[tilex];
  // inside clb
  const clb = clbDecoders.get(name);
  if (clb && clb.isInside(x, y)) {
    console.log(clb);
    if (btn != 0)
      clbDrawPopup(clb, x, y);
    else
    { 
      clb.routeFromOutputs(); 
      visStartPoint = clb.startPoint;
      visPathInfo = clb.pathInfo;
      visDestList = clb.destList;
      visStartPoint2 = clb.startPoint2;
      visPathInfo2 = clb.pathInfo2;
      visDestList2 = clb.destList2;
      updateRoute(); 
    }
  }
  let iob = iobDecoders.getFromXY(x, y);
  if (iob) {
    console.log(iob);
    console.log(pipDecoder);
    if (btn != 0)
      iobDrawPopup(iob, x, y);
    else
    { 
      iob.routeFromInput();
      visStartPoint = iob.startPoint;
      visPathInfo = iob.pathInfo;
      visDestList = iob.destList;
      visStartPoint2 = '';
      visPathInfo2 = [];
      visDestList2 = [];
      updateRoute(); 
    }
    console.log(iob.info());
    return;
  }
}

function removePopups() {
  clbRemovePopup();
  iobRemovePopup();
}
