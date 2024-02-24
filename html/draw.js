
// SIZE
// 1208x1345
// X: 9x104+272
// Y: 9x120+265

// From row name to [internal Y coordinate (G), screen Y coordinate]
var rowInfo = {

 // "row.A.io2": [188, 60], // My invention, I/O above CLB
 "row.A.local.0": [211, 2],
 "CLK.AA.O": [208, 22],
 "row.A.long.2": [207, 26],
 "row.A.local.1": [205, 30],
 "row.A.local.2": [204, 34],
 "row.A.local.3": [202, 38],
 "row.A.local.4": [201, 42],
 "row.A.long.3": [199, 48],
 "row.A.local.5": [198, 52], // Also I/O lines, would be io1
 "row.A.io2": [197, 56], // My invention, I/O above CLB
 "row.A.io3": [196, 60], // My invention, row near top of CLB
 "row.A.io4": [195, 64], // My invention, I/O above CLB
 "row.A.io5": [194, 68], // My invention, I/O aligned with top of CLB
 "row.A.io6": [193, 72], // My invention, I/O just below top of CLB
 "row.A.b": [192, 80], // My invention, input b to CLB
 "row.A.c": [191, 86], // My invention, input c to CLB
 "row.A.k": [190, 92], // My invention, input k to CLB
 "row.A.y": [189, 96], // My invention, input d to CLB

 "row.K.local.0": [17, 604+144],
 "row.K.io1": [16, 608+144], // My invention
 "row.K.io2": [15, 612+144], // My invention
 "row.K.io3": [14, 616+144], // My invention
 "row.K.io4": [13, 620+144], // My invention
 "row.K.long.1": [12, 624+144],
 "row.K.local.1": [10, 630+144],
 "row.K.local.2": [9, 634+144],
 "row.K.local.3": [7, 638+144],
 "row.K.local.4": [6, 642+144],
 "row.K.local.6": [5, 644+144],
 "row.K.long.2": [4, 646+144],
 "row.K.clk": [3, 652+144], // My invention
 "row.K.local.5": [0, 672+144],
}

// From column name to [internal X coordinate, screen X coordinate]
var colInfo = {
 "col.A.local.0": [0, 2],
 "col.A.long.2": [3, 22],
 "col.A.local.1": [5, 26],
 "col.A.local.2": [6, 30],
 "col.A.local.3": [8, 34],
 "col.A.local.4": [9, 38],
 "col.A.long.3": [11, 44],
 "col.A.long.4": [12, 48],
 "col.A.clk": [13, 52], // My invention
 "col.A.local.5": [14, 56],
 "col.A.io1": [15, 62], // My invention, three I/O verticals feeding to matrices
 "col.A.io2": [16, 66], // My invention
 "col.A.io3": [17, 70], // My invention
 "col.A.x": [18, 74], // My invention, x input to CLB
 "col.A.clbl1": [19, 78], // My invention, one column left of center of CLB.
 "col.A.clb": [21, 88], // My invention, through center of CLB.
 "col.A.clbr1": [22, 94], // My invention, one column right of center of CLB.
 "col.A.clbr2": [23, 98], // My invention, two columns right of center of CLB.
 "col.A.clbr3": [24, 102], // My invention, three columns right of center of CLB.

// Note: clbw1-3 are wrapped around clbr1-3 from the neighboring tile.
// E.g. AB.clbl3 is above AA
// This makes assigning iobs to columns easier.
 "col.K.clbw1": [202, 598+144],
 "col.K.clbw2": [203, 602+144],
 "col.K.clbw3": [204, 606+144],
 "col.K.io1": [205, 610+144], // My invention, the column used just for I/O pins
 "col.K.io2": [206, 614+144], // My invention, the column used just for I/O pins
 "col.K.local.0": [207, 618+144],
 "col.K.io3": [208, 622+144], // My invention, the column used just for I/O pins
 "col.K.long.1": [209, 626+144],
 "col.K.long.2": [210, 630+144],
 "col.K.local.1": [212, 636+144],
 "col.K.local.2": [213, 640+144],
 "col.K.local.3": [215, 644+144],
 "col.K.local.4": [216, 648+144],
 "col.K.long.3": [218, 652+144],
 "col.K.local.5": [221, 672+144],
 "col.K.clb": [999, 999], // My invention
}

const rowFromG = {}; // Look up the row name from the G coordinate
const colFromG = {}; // Look up the column name from the G coordinate

const rowFromS = {}; // Look up the row name from the Screen coordinate
const colFromS = {}; // Look up the column name from the Screen coordinate

function initNames() {
  // Generate formulaic row and column names (B through H)
  for (var i = 1; i < 10; i++) {
    var cstart = 27 + 20 * (i-1);
    var name = "ABCDEFGHIJK"[i];

    // Note: clbw1-3 are wrapped around clbr1-3 from the neighboring tile.
    // E.g. AB.clbl3 is above AA
    // This makes assigning iobs to columns easier.
    colInfo['col.' + name + '.clbw1'] = [cstart - 5, 94 + 72 * (i-1)]; // My invention, one column right of center of CLB.
    colInfo['col.' + name + '.clbw2'] = [cstart - 4, 98 + 72 * (i-1)]; // My invention, two columns right of center of CLB.
    colInfo['col.' + name + '.clbw3'] = [cstart - 3, 102 + 72 * (i-1)]; // My invention, three columns right of center of CLB.
    colInfo['col.' + name + '.local.1'] = [cstart, 108 + 72 * (i-1)];
    colInfo['col.' + name + '.local.2'] = [cstart + 1, 112 + 72 * (i-1)];
    colInfo['col.' + name + '.local.3'] = [cstart + 3, 116 + 72 * (i-1)];
    colInfo['col.' + name + '.local.4'] = [cstart + 4, 120 + 72 * (i-1)];
    colInfo['col.' + name + '.local.5'] = [cstart + 6, 126 + 72 * (i-1)];
    colInfo['col.' + name + '.local.6'] = [cstart + 7, 130 + 72 * (i-1)]; // y connection
    colInfo['col.' + name + '.long.1'] = [cstart + 8, 134 + 72 * (i-1)];
    colInfo['col.' + name + '.long.2'] = [cstart + 9, 138 + 72 * (i-1)];
    colInfo['col.' + name + '.clk'] = [cstart + 10, 142 + 72 * (i-1)]; // my invention
    colInfo['col.' + name + '.x'] = [cstart + 11, 146 + 72 * (i-1)]; // my invention
    colInfo['col.' + name + '.clbl2'] = [cstart + 12, 150 + 72 * (i-1)]; // My invention, two columns left of center of CLB.
    colInfo['col.' + name + '.clbl1'] = [cstart + 13, 154 + 72 * (i-1)]; // My invention, one column left of center of CLB.
    // col.X.clb is my name for the column running through the middle of the CLB
    colInfo['col.' + name + '.clb'] = [cstart + 14, 160 + 72 * (i-1)];
    colInfo['col.' + name + '.clbr1'] = [cstart + 15, 166 + 72 * (i-1)]; // My invention, one column right of center of CLB.
    colInfo['col.' + name + '.clbr2'] = [cstart + 16, 170 + 72 * (i-1)]; // My invention, two columns right of center of CLB.
    colInfo['col.' + name + '.clbr3'] = [cstart + 17, 174 + 72 * (i-1)]; // My invention, three columns right of center of CLB.

    // Interpreting die file: row.B.local.1 = die file Y 28 = G 145, i.e. sum=173
    var rstart = 25 + 19 * (9 - i);
    // row.X.io1 is my name for the I/O row below the CLB
    rowInfo['row.' + name + '.io1'] = [rstart + 11, 100 + 72 * (i-1)];
    rowInfo['row.' + name + '.io2'] = [rstart + 10, 104 + 72 * (i-1)];
    rowInfo['row.' + name + '.io3'] = [rstart + 9, 108 + 72 * (i-1)];
    rowInfo['row.' + name + '.local.0'] = [rstart + 7, 112 + 72 * (i-1)];
    rowInfo['row.' + name + '.local.1'] = [rstart + 6, 114 + 72 * (i-1)];
    //console.log("INIT: "+i+" - "+(rstart+6));
    rowInfo['row.' + name + '.local.3'] = [rstart + 5, 118 + 72 * (i-1)];
    rowInfo['row.' + name + '.local.4'] = [rstart + 3, 122 + 72 * (i-1)];
    rowInfo['row.' + name + '.local.5'] = [rstart + 2, 126 + 72 * (i-1)];
    rowInfo['row.' + name + '.long.1'] = [rstart, 132 + 72 * (i-1)];
    // row.X.io6 is my name for the row near the top of the clb
    // row.X.b is my name for the row through input b
    // row.X.c is my name for the row running through the middle of the CLB, through input c, output y
    // row.X.k is my name for the row through input k
    // row.X.y is my name for the row through input y
    rowInfo['row.' + name + '.io4'] = [rstart - 1, 136 + 72 * (i-1)];
    rowInfo['row.' + name + '.io5'] = [rstart - 2, 140 + 72 * (i-1)];
    rowInfo['row.' + name + '.io6'] = [rstart - 3, 144 + 72 * (i-1)];
    rowInfo['row.' + name + '.b'] = [rstart - 4, 152 + 72 * (i-1)];
    rowInfo['row.' + name + '.c'] = [rstart - 5, 158 + 72 * (i-1)];
    rowInfo['row.' + name + '.k'] = [rstart - 6, 164 + 72 * (i-1)];
    rowInfo['row.' + name + '.y'] = [rstart - 7, 168 + 72 * (i-1)];
  }

  // The e.g. DE.B entries
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 10; row++) {
      const fullname = "ABCDEFGHIJ"[row] + "ABCDEFGHIJ"[col];
      rowInfo[fullname + '.B'] = rowInfo['row.' + "ABCDEFGHIJ"[row] + ".b"];
      rowInfo[fullname + '.C'] = rowInfo['row.' + "ABCDEFGHIJ"[row] + ".c"];
      rowInfo[fullname + '.K'] = rowInfo['row.' + "ABCDEFGHIJ"[row] + ".k"];
      rowInfo[fullname + '.X'] = rowInfo['row.' + "ABCDEFGHIJ"[row] + ".c"];
      rowInfo[fullname + '.Y'] = rowInfo['row.' + "ABCDEFGHIJ"[row] + ".y"];
      colInfo[fullname + '.D'] = colInfo['col.' + "ABCDEFGHIJ"[col] + ".clb"];
      colInfo[fullname + '.A'] = colInfo['col.' + "ABCDEFGHIJ"[col] + ".clbr1"];
      // colInfo[fullname + '.A'] = colInfo['col.' + "ABCDEFGHIJ"[col] + ".clb"];
    }
  }

  // Make reverse tables
  Object.entries(rowInfo).forEach(([key, val]) => rowFromG[val[0]] = key);
  Object.entries(colInfo).forEach(([key, val]) => colFromG[val[0]] = key);
  Object.entries(rowInfo).forEach(([key, val]) => rowFromS[val[1]] = key);
  Object.entries(colInfo).forEach(([key, val]) => colFromS[val[1]] = key);
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

  function drawLayout(ctx) {
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
