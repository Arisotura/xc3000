
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var bitstreams = [];
var curBitstream = null;
var curPackage = null;


function parseBitstream(type, contents)
{
  var view = null;
  var length = 0;
  var startoffset = 0;
  var pos = 0;
  var idx = 0;

  bitstreams = [];

  if (type == 'rbt')
  {
    view = contents.replaceAll(/[^01]/g, '');
    let start = view.indexOf('111111110010');
    if (start == -1)
    {
      alert('Bad header');
      return;
    }

    view = view.substring(start);
    length = view.length;
    startoffset = start;

    function readbits(n)
    {
      var ret = 0;
      for (var i = 0; i < n; i++)
      {
        ret <<= 1;
        if (view[pos] == '1') ret |= 1;
        pos++;
      }
      return ret;
    }
  }
  else if (type == 'bin')
  {
    view = new Uint8Array(contents);

    let start = 0;
    while (start < view.byteLength)
    {
      let chk = (view[start] << 8) | view[start+1];
      let chk2 = view[start+4];
      if ((((chk & 0xFF0F) == 0xFF04 && (chk2 & 0xF0) == 0xF0)) ||
          (((chk & 0xFFF0) == 0xFF20) && (chk2 & 0x0F) == 0x0F))
        break;

      start++;
    }

    view = view.slice(start);
    length = view.byteLength * 8;
    startoffset = start * 8;

    let chk = (view[0] << 8) | view[1];
    if ((chk & 0xFF0F) == 0xFF04)
    {
      function readbits(n)
      {
        var ret = 0;
        for (var i = 0; i < n; i++)
        {
          ret <<= 1;
          ret |= ((view[pos>>3] >> (pos&7)) & 1);
          pos++;
        }
        return ret;
      }
    }
    else if ((chk & 0xFFF0) == 0xFF20)
    {
      function readbits(n)
      {
        var ret = 0;
        for (var i = 0; i < n; i++)
        {
          ret <<= 1;
          ret |= ((view[pos>>3] >> (7-(pos&7))) & 1);
          pos++;
        }
        return ret;
      }
    }
    else
    {
      alert('Bad header');
      return;
    }
  }
  else
  {
    alert('???');
    return;
  }

  while (pos < length)
  {
    var hdrpos = pos;

    var hdr = readbits(12);
    if (hdr != 0xFF2)
    {
      pos -= 11;
      continue;
    }

    var hdrlen = readbits(24);
    if (length < (hdrpos+hdrlen-4))
    {
      pos -= 24;
      continue;
    }

    var chk = readbits(4);
    if (chk != 0xF)
    {
      pos -= 28;
      continue;
    }

    while (readbits(1) != 0);
    pos--;

    for (;;)
    {
      var startpos = pos;
      var family = -1;

      for (var i = 0; i < chipFamilies.length; i++)
      {
        pos = startpos;

        var flen = chipFamilies[i].frameLen;
        var fnum = chipFamilies[i].frameNum;

        if ((pos + (flen * fnum) + 4) > length)
          break;

        pos++;
        pos += (flen - 4);
        var chk1 = readbits(4);
        pos += (flen - 4);
        var chk2 = readbits(4);
        pos += (flen - 4);
        var chk3 = readbits(4);
        pos += (flen - 4);
        var chk4 = readbits(4);

        pos = startpos;
        pos += (flen * (fnum - 1));
        pos -= 3;
        var chk5 = readbits(4);
        pos += (flen - 4);
        var chk6 = readbits(4);

        if (chk1 == 0xE &&
            chk2 == 0xE &&
            chk3 == 0xE &&
            chk4 == 0xE &&
            chk5 == 0xE &&
            chk6 == 0xF)
        {
          family = i;
          break;
        }
      }

      if (family == -1)
      {
        console.log('could not identify bitstream at ' + pos + ', stopping parser');
        break;
      }

      pos = startpos;
      let fam = chipFamilies[family];

      console.log('id: ' + family);
      console.log(fam.name + ' at ' + pos);

      var bs = {
        family: fam,
        offset: startoffset+startpos,
        data: new Array(fam.frameLen),
      };

      for (var i = 0; i < fam.frameLen; i++)
        bs.data[i] = new Array(fam.frameNum);

      for (var i = 0; i < fam.frameNum; i++)
      {
        for (var j = 0; j < fam.frameLen; j++)
        {
          var idx_in = (i * fam.frameLen) + j;
          bs.data[(fam.frameLen - 1) - j][(fam.frameNum - 1) - i] = readbits(1);
        }
      }

      bitstreams.push(bs);

      pos += 4;
      while (pos < (hdrpos+hdrlen) && pos < length && readbits(1) != 0) ;
      if (pos >= (hdrpos+hdrlen) || pos >= length) break;
      pos--;
    }
  }
}

function selectBitstream(bsid, pkgid)
{
  curBitstream = bitstreams[bsid];
  curPackage = chipPackages[curBitstream.family.name][pkgid];

  initParser();
}

/*
 * The model for a decoder is:
 * startDecode() is called to initialize.
 * add() is called to add bits as they are parsed from the XC2064-def.txt file.
 * decode() is called at the end to complete the decoding.
 */

let bitTypes;
function decode() {
  //bitTypes = new Array(196 * 87);
  //decoders.forEach(d => d.startDecode());
  /*for (let i = 0; i < 196 * 87; i++) {
    let entry = config[i];
    if (entry == undefined || entry == "----- NOT USED -----") {
      bitTypes[i] = BITTYPE.unused;
      continue;
    }
    let m = entry.match(/IOB (P\d+)(.*)/);
    if (m) {
      bitTypes[i] = BITTYPE.iob;
      //console.log("IOB "+m[1]);
      iobDecoders.getFromPin(m[1]).add(m[2], rawBitstream[i]);
      continue;
    }
    m = entry.match(/PIP\s+(.*)/);
    if (m) {
      bitTypes[i] = BITTYPE.pip;
      pipDecoder.add(m[1], rawBitstream[i]);
      continue;
    }
    m = entry.match(/Bidi\s+(.*)/);
    if (m) {
      bitTypes[i] = BITTYPE.bidi;
      bidiDecoder.add(m[1], rawBitstream[i]);
      continue;
    }
    m = entry.match(/Magic @ (\S+) (\d) (\d)$/);
    if (m) {
      bitTypes[i] = BITTYPE.switch;
      if (rawBitstream[i] != 1) {
        //if (i < (87*2)) console.log("SWITCH "+m[1]+" "+switchDecoders.getFromG(m[1]).name+" - "+m[2]+"->"+m[3]);
        //if (switchDecoders.getFromG(m[1]).name=='IK.8.2') console.log("["+i+"] SWITCH "+m[1]+" "+switchDecoders.getFromG(m[1]).name+" - "+m[2]+"->"+m[3]);
        switchDecoders.getFromG(m[1]).add(parseInt(m[2]), parseInt(m[3]));
      }
      continue;
    }
    m = entry.match(/CLB ([A-J][A-J])\s*(.*)/);
    if (m) {
      if (entry.match(/Logic Table/)) {
        bitTypes[i] = BITTYPE.lut;
      } else {
        bitTypes[i] = BITTYPE.clb;
      }
      //console.log("CLB "+m[1]);
      clbDecoders.get(m[1]).add(m[2], rawBitstream[i]);
      continue;
    }
    m = entry.match(/CLB (CLK.[AK][AK].I)\s*(.*)/);
    if (m) {
      bitTypes[i] = BITTYPE.clb;
      //onsole.log("CLB "+m[1]);
      clbDecoders.get(m[1]).add(m[2], rawBitstream[i]);
      continue;
    }
    m = entry.match(/Other (.*)/);
    if (m) {
      bitTypes[i] = BITTYPE.other;
      otherDecoder.add(m[1], rawBitstream[i]);
      continue;
    }
    //console.log('UNKNOWN:', entry);
  }
  decoders.forEach(d => d.decode());
  iobDecoders.routeFromInput();
  clbDecoders.routeFromOutputs();
  //switchDecoders.doConnect();
  //console.log(clbDecoders);*/
}

var iobDecoders;
var pipDecoder;
var clbDecoders;
var otherDecoder;
var switchDecoders;
var tribufDecoders;
var pullupDecoders;
var clockDecoders;
var bidiDecoder;
let decoders = [];
function initDecoders() {
  pipDecoder = new PipDecoder();
  iobDecoders = new IobDecoders();
  //bidiDecoder = new BidiDecoder();
  //otherDecoder = new OtherDecoder();
  clbDecoders = new ClbDecoders;
  switchDecoders = new SwitchDecoders();
  tribufDecoders = new TriBufDecoders();
  pullupDecoders = new PullUpDecoders();
  clockDecoders = new ClockDecoders;
  //decoders = [iobDecoders, pipDecoder, bidiDecoder, otherDecoder, clbDecoders, switchDecoders];
  decoders = [pipDecoder, iobDecoders, clbDecoders, switchDecoders, tribufDecoders, pullupDecoders, clockDecoders];
  pipDecoder.generateLongLines();
  switchDecoders.generateLocalLines();
  decoders.forEach(d => d.startDecode());
}

class ClkDecoder {
  constructor(name) {
    this.name = name;

    this.level = 0;
    //this.dirty = {I:false};
  }

  reset()
  {
    this.level = 0;
  }

  setLevel(name, val)
  {
    if (name != 'I') console.log('WHAT??');
    if (val != this.level)
    {
      console.log('CLOCK '+this.name+' = '+val);

      this.level = val;
      //this.dirty['I'] = true;
    }
  }

  update()
  {
    //this.dirty['I'] = false;

    var level = this.level;
    this.destList.forEach(function(dest)
    {
      propagateLevel(dest, level);
    });
  }

  generatePips()
  {
    var pips = [];
    var mux = null;
    var self = this;

    // UGLY AF
    if (this.name == 'CLK.AA.I')
    {
      pips = ['col.A.io2 row.B.io2',
        'col.A.io2 row.A.io5',
        'col.A.local.3 row.A.io4',
        'col.A.long.3 row.A.io4',
        'col.A.io2 row.A.long.3',
        'col.A.io2 row.A.local.3'];

      // checkme: 5 is weird
      mux = {0x1E: 0, 0x1D: 1, 0x1B: 2, 0x17: 3, 0x0F: 4, 0x3F: 5}[this.mux];
    }
    else if (this.name == 'CLK.KK.I')
    {
      pips = ['col.K.io3 row.K.io4',
        'col.K.long.2 row.K.io4',
        'col.K.local.2 row.K.io4',
        'col.K.io1 row.K.io3',
        'col.K.io1 row.K.long.1',
        'col.K.io1 row.K.local.2',
        'col.K.local.0 row.K.local.6'];

      // checkme: 5 is weird
      mux = {0xDE: 0, 0xDD: 1, 0xDB: 2, 0xD7: 3, 0xCF: 4, 0xFF: 5, 0x3F: 6}[this.mux];
    }
    else
    {
      console.log('what');
    }

    this.ipips = [];
    pips.forEach(function(pip)
    {
      let parts = pip.split(" ");
      let pipname;
      let colName = parts[0];
      let rowName = parts[1];

      pipname = colName + ":" + rowName;

      let col = colInfo[colName];
      let row = rowInfo[rowName];
      if (col == undefined) {
        console.log('Bad Clb', tile, pip, 'col', colName, "->", col, ";", rowName, "->", row);
        return;
      }
      if (row == undefined) {
        console.log('Bad Clb', tile, pip, 'col', colName, "->", col, ";", rowMName, "->", row);
        return;
      }
      let gCoord = col[0] + "G" + row[0];
      //ClbDecoders.gToName[gCoord] = pipname;
      //ClbDecoders.tileToG[pipname] = gCoord;
      self.ipips.push([gCoord, col[1], row[1], pipname, false]);
    });
    if (mux != undefined && mux != null)
      this.ipips[mux][4] = true;
  }

  startDecode() {
    this.mux = 0;
  }

  add(str, bit) {
    //console.log(this.name+" add "+str+" = "+bit);
    const m = str.match(/MuxBit: (\d)/);
    if (m) {
      this.mux |= (bit << parseInt(m[1]));
    }
  }

  decode() {
    this.generatePips();
  }

  render(ctx) {
    drawPips(ctx, this.ipips);
  }

  routeFromOutputs()
  {
    // CLK.AA.I: 
    //   (15G197 to 15G208)
    //   top horizontal line: 13G208 to 208G208
    //   17G208 (P11 output)
    //   vertical: 13G__ 37G__ 57G__ .. 197G__
    //     vertical: __G208 to __G19
    //     vretical: 13G208 to 13G13
    //     horizontal: 13G17 to 5G17 (if 13G17 enabled)
    //     vertical: 14G13 to 14G5 (if 14G13 enabled)
    //   vertical: 207G208 to 207G199 (if 207G208 enabled)
    //   horizontal: 208G198 to 216G198 (if 208G198 enabled)
    //
    // CLK.KK.I:
    //   bottom horizontal line: 205G3 to 12G3
    //   202G3 (P53 output)
    //   196G3 176G3 ... 36G3 12G3

    var pathinfo = [];
    var destlist = [];
    var start = '';

    if (this.name == 'CLK.AA.I')
    {
      start = 'CLK:AA:O';

      // AAAAAAAAAA
      pathinfo.push(['15G197', '15G208']);
      pathinfo.push(['13G208', '208G208']);
      pathinfo.push(['13G208', '13G13']);
      pathinfo.push(['13G13', '14G13']);
      for (var i = 1; i < 10; i++)
        pathinfo.push([(17+(20*i))+'G208', (17+(20*i))+'G19']);
      pathinfo.push(['208G208', '208G198']);

      var iob = iobDecoders.getFromPin('P11');
      if (typeof iob != 'undefined')
      {
        var entry = iob.opips[0];
        if (entry[4])
        {
          // TODO path?
          destlist.push('IOB:P11:O');
        }
      }

      var turns = [];
      turns.push('T|13G208');
      for (var i = 1; i < 10; i++)
        turns.push('T|'+(17+(i*20))+'G208');
      turns.push('P|207G208');
      turns.push('P-208G198');
      turns.push('P|13G14');

      turns.forEach(function(t)
      {
        var p = t.substring(2);
        if (t[0] == 'P')
        {
          var entry = pipDecoder.entries[p];
          if (typeof entry == 'undefined') return;
          if (entry != 0) return;
        }

        pipDecoder.traceFrom(p, t[1], destlist, pathinfo);
      });
    }
    else if (this.name == 'CLK.KK.I')
    {
      start = 'CLK:KK:O';

      pathinfo.push(['205G3', '12G3']);
      
      var iob = iobDecoders.getFromPin('P53');
      if (typeof iob != 'undefined')
      {
        var entry = iob.opips[0];
        if (entry[4])
        {
          // TODO path?
          destlist.push('IOB:P53:O');
        }
      }

      var pips = [];
      for (var i = 9; i >= 1; i--)
        pips.push((16+(i*20))+'G3');
      pips.push('12G3');

      pips.forEach(function(p)
      {
        var entry = pipDecoder.entries[p];
        if (typeof entry == 'undefined') return;
        if (entry != 0) return;

        pipDecoder.traceFrom(p, '|', destlist, pathinfo, 2);
      });
    }
    else
    {
      console.log('what');
    }

    this.startPoint = start;
    this.pathInfo = pathinfo;
    this.destList = destlist;
  }
}

class BidiDecoder {
  constructor() {
    this.entries = {};
  }

  startDecode() {
    this.entries = {};
  }

  add(str, bit) {
    this.entries[str] = bit;
  }

  decode() {}

  render(ctx) {
  }
}


  /**
   * Converts a symbolic name to G coordinates.
   */
  function nameToG(str) {
    if (str.includes("PAD")) {
      return IobDecoders.nameToG[str];
    }
    const m = str.match(/([A-I][A-I])\.8\.(\d)\.(\d)$/);
    if (str.match(/([A-I][A-I])\.8\.(\d)\.(\d)$/)) {
      return getSwitchCoords(str)[0];
    }
    const parts = str.split(':');
    const col = colInfo[parts[0]];
    const row = rowInfo[parts[1]];
    if (col == undefined || row == undefined) {
      console.log("Couldn't convert name", str);
      return;
    }
    return col[0] + "G" + row[0];
  }

  /**
   * Converts G coordinates to a symbolic name.
   */
  function gToName(str) {
    if (IobDecoders.gToName[str]) {
      return IobDecoders.gToName[str];
    }
    const parts = str.split('G');
    const col = colFromG[parts[0]];
    const row = rowFromG[parts[1]];
    if (col == undefined || row == undefined) {
      console.log("Couldn't convert name", str);
      return;
    }
    return col + ":" + row;
  }


class OtherDecoder {
  constructor() {
  }

  startDecode() {
    this.input = "";
    this.donepad = "";
    this.read = "";
    this.unk = "";
    this.entries = {};
  }

  add(str, bit) {
    this.entries[str] = bit;
  }

  decode() {
    this.input = this.entries["TTL/CMOS level Inputs"] ? "TTL" : "CMOS";
    if (this.entries["Single/Unlimited FPGA readback if readback enabled"]) {
      this.read = this.entries["FPGA readback Enabled/Disable"] ? "0" : "1";
    } else {
      this.read = "CMD";
    }
    this.donepad = this.entries["DONE pin Pullup/No Pullup"] ? "NOPULLUP" : "PULLUP";
    const unk = "" + this.entries["UNknown 1"] + this.entries["UNknown 2"] + this.entries["UNknown 3"] + this.entries["UNknown 4"];
    if (unk != "1011") {
      this.unk = "Unknown: " + unk;
    }
  }

  info() {
    return this.input + " " + this.donepad + " " + this.read + " " + this.unk;
  }

  render(ctx) {
  }
}


const BITTYPE = Object.freeze({lut: 1, clb: 2, pip: 3, switch: 5, iob: 6, bidi: 7, other: 8, unused: 9});
  class PipDecode {
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
        alert('Out of bounds bitstreamTable index: ' + bitPt[0] + ',' + bitPt[1]);
      }
      this.state = 0;

    }

    decode(bitstreamTable) {
      if (this.bitPt[0] < 0) {
        this.state = -1;
      } else {
        this.state = bitstreamTable[this.bitPt[0]][this.bitPt[1]];
      }
    }

    /**
     * Returns the function of each (known) bit in the bitstreamTable.
     *
     * Format: [[x, y, type], ...]
     */
    getBitTypes() {
      return [[this.bitPt[0], this.bitPt[1], BITTYPE.pip]];
    }
  }

  // There are 9 types of tiles depending on if they are along an edge. (Think of a tic-tac-toe grid.) Most will be the center type.
  // Maybe we could make 9 subclasses for everything, but for now I'll hardcode types in the code.
  const TILE = Object.freeze({ul: 1, top: 2, ur: 3, left: 4, center: 5, right: 6, ll: 7, bottom: 8, lr: 9});

  function tileType(x, y) {
    if (y == 0) {
      if (x == 0) {
        return TILE.ul;
      } else if (x < 8) {
        return TILE.top;
      } else if (x == 8) {
        return TILE.ur;
      }
    } else if (y < 8) {
      if (x == 0) {
        return TILE.left;
      } else if (x < 8) {
        return TILE.center;
      } else if (x == 8) {
        return TILE.right;
      }
    } else if (y == 8) {
      if (x == 0) {
        return TILE.ll;
      } else if (x < 8) {
        return TILE.bottom;
      } else if (x == 8) {
        return TILE.lr;
      }
    }
    throw "unexpected";
  }

  class TileDecode {
    constructor(x, y) {
      this.x = x; // Index 0-8
      this.y = y;
      this.name = "ABCDEFGHIJK"[y] + "ABCDEFGHIJK"[x];
      this.screenPt = [x * 72 + 78, y * 72 + 68];
      this.gPt = [x * 19, y * 20];
      this.bitPt = [xTileStarts[x], yTileStarts[y]];
      this.pips = [];
      this.pins = [];
      if (x < 10 && y < 10) {
        this.clb = new Clb(x, y, [x * 72 + 78, y * 72 + 68], [x * 19, y * 20], this.bitPt);
      } else {
        this.clb = null;
      }
      this.type = tileType(x, y);

      var row = "ABCDEFGHIJK"[y];
      var col = "ABCDEFGHIJK"[x];
      // Substitute for ROW and COL in the pip name
      function rename(pip) {
        return pip.replace('ROW', row).replace('COL', col);
      }

      // For a repeated tile, the pip location is relative to the origin for tile BB. The x and y will need to shift based on the row/column.
      // (The pip location could be given relative to the start of tile BB, but it's not.)
      // This shift is not constant because of the buffers.
      // For non-repeated tiles, the pip does not need to be adjusted.
      // 
      var xoffset = xTileStarts[x] - xTileStarts[1]; // xoffset == 0 for tile B
      var yoffset = yTileStarts[y] - yTileStarts[1]; // xoffset == 0 for tile B

      this.switch1 = null;
      this.switch2 = null;
      if (this.type == TILE.ul) {

        // Name of pip and corresponding bitmap entry
        var pips = [
          ["col.A.long.2:row.A.long.2", [6, 3]], ["col.A.local.1:row.A.long.2", [7, 3]], ["col.A.long.3:row.A.long.2", [12, 1]],
          ["col.A.long.2:row.A.local.1", [9, 3]], ["col.A.local.1:row.A.local.1", [8, 3]],
          ["col.A.local.2:row.A.local.2", [12, 3]],
          ["col.A.local.3:row.A.local.3", [14, 3]], ["col.A.long.4:row.A.local.3", [17, 0]],
          ["col.A.local.4:row.A.local.4", [20, 3]],
          ["col.A.local.4:row.A.long.3", [20, 1]], ["col.A.long.3:row.A.long.3", [13, 3]], ["col.A.long.4:row.A.long.3", [16, 3]]];
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), pip[1])));
      } else if (this.type == TILE.top) {
        var pips = [
          ["col.COL.long.1:row.A.long.2", [30, 1]],
          ["col.COL.long.2:row.A.local.1", [33, 3]],
          ["col.COL.local.5:row.A.local.2", [28, 3]], ["col.COL.long.1:row.A.local.2", [31, 2]],
          ["col.COL.local.5:row.A.local.3", [29, 2]], ["col.COL.long.2:row.A.local.3", [35, 0]],
          ["col.COL.long.1:row.A.local.4", [33, 2]],
          ["col.COL.local.1:row.A.long.3", [23, 2]], ["col.COL.local.4:row.A.long.3", [38, 1]], ["col.COL.long.1:row.A.long.3", [32, 2]], ["col.COL.long.2:row.A.long.3", [32, 3]]];

        this.switch1 = new Switch(this, 1);
        this.switch2 = new Switch(this, 2);

        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), [pip[1][0] + xoffset, pip[1][1]])));

      } else if (this.type == TILE.ur) {
        var pips = [
          ["col.K.local.4:row.A.long.2", [192, 4]], ["col.K.long.3:row.A.long.2", [193, 4]],
          ["col.K.local.0:row.A.local.1", [-1, -1]], ["col.K.local.4:row.A.local.1", [191, 2]], ["col.K.long.3:row.A.local.1", [192, 2]],
          ["col.K.local.0:row.A.local.2", [-1, -1]], ["col.K.local.3:row.A.local.2", [195, 4]],
          ["col.K.local.0:row.A.local.3", [-1, -1]], ["col.K.local.2:row.A.local.3", [197, 4]],
          ["col.K.local.1:row.A.local.4", [196, 4]], ["col.K.local.0:row.A.local.4", [-1, -1]],
          ["col.K.local.0:row.A.long.3", [-1, -1]], ["col.K.long.1:row.A.long.3", [194, 2]], ["col.K.long.2:row.A.long.3", [193, 2]],
          ["col.K.long.2:row.A.local.5", [-1, -1]], ["col.K.local.1:row.A.local.5", [-1, -1]], ["col.K.local.2:row.A.local.5", [-1, -1]],  ["col.K.local.3:row.A.local.5", [-1, -1]],  ["col.K.local.4:row.A.local.5", [-1, -1]]];
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), pip[1])));

        // pins.push(new Iob(11, 58, 'left'));
        // pins.push(new Iob(9, 1, 'top'));
        // pins.push(new Iob(8, 2, 'top'));
      } else if (this.type == TILE.left) {
        var pips = [
          ["col.A.long.3:row.ROW.local.1", [9, 11]],
          ["col.A.long.4:row.ROW.local.3", [11, 11]],
          ["col.A.long.2:row.ROW.long.1", [5, 11]], ["col.A.local.1:row.ROW.long.1", [4, 11]], ["col.A.local.4:row.ROW.long.1", [17, 11]], ["col.A.long.3:row.ROW.long.1", [10, 11]], ["col.A.long.4:row.ROW.long.1", [15, 11]]];
        this.switch1 = new Switch(this, 1);
        this.switch2 = new Switch(this, 2);
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), [pip[1][0], pip[1][1] + yoffset])));
      } else if (this.type == TILE.center) {
        var pips = [
          ["col.COL.local.5:row.ROW.local.0", [23, 11]],
          ["col.COL.long.2:row.ROW.local.1", [32, 11]],
          ["col.COL.local.5:row.ROW.local.3", [24, 11]], ["col.COL.local.6:row.ROW.local.3", [27, 11]], ["col.COL.long.1:row.ROW.local.3", [28, 11]],
          ["col.COL.local.5:row.ROW.local.4", [25, 11]], ["col.COL.local.6:row.ROW.local.4", [26, 11]], ["col.COL.long.2:row.ROW.local.4", [33, 11]],
          ["col.COL.long.1:row.ROW.local.5", [31, 11]],
          ["col.COL.local.1:row.ROW.long.1", [22, 11]], ["col.COL.local.4:row.ROW.long.1", [35, 11]]];
        // Main part
        this.switch1 = new Switch(this, 1);
        this.switch2 = new Switch(this, 2);
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), [pip[1][0] + xoffset, pip[1][1] + yoffset])));
      } else if (this.type == TILE.right) {
        var pips = [
          ["col.K.long.2:row.ROW.local.1", [199, 11]],
          ["col.K.long.1:row.ROW.local.3", [193, 11]],
          ["col.K.long.2:row.ROW.local.4", [193, 12]],
          ["col.K.long.1:row.ROW.local.5", [194, 12]],
          ["col.K.long.1:row.ROW.long.1", [194, 11]], ["col.K.long.2:row.ROW.long.1", [198, 11]], ["col.K.local.1:row.ROW.long.1", [195, 11]], ["col.K.local.4:row.ROW.long.1", [191, 11]], ["col.K.long.3:row.ROW.long.1", [192, 11]]];
        this.switch1 = new Switch(this, 1);
        this.switch2 = new Switch(this, 2);
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), [pip[1][0], pip[1][1] + yoffset])));
      } else if (this.type == TILE.ll) {
        // bottom left
        var pips = [
          ["col.A.local.1:row.K.local.0", [-1, -1]], ["col.A.local.2:row.K.local.0", [-1, -1]], ["col.A.local.3:row.K.local.0", [-1, -1]], ["col.A.local.4:row.K.local.0", [-1, -1]], ["col.A.long.3:row.K.local.0", [-1, -1]],
          ["col.A.local.4:row.K.long.1", [20, 69]], ["col.A.long.3:row.K.long.1", [13, 67]], ["col.A.long.4:row.K.long.1", [16, 67]], ["col.A.local.5:row.K.long.1", [-1, -1]],
          ["col.A.local.4:row.K.local.1", [20, 67]], ["col.A.local.5:row.K.local.1", [-1, -1]],
          ["col.A.local.3:row.K.local.2", [14, 67]], ["col.A.long.4:row.K.local.2", [17, 70]], ["col.A.local.5:row.K.local.2", [-1, -1]],
          ["col.A.local.2:row.K.local.3", [12, 67]], ["col.A.local.5:row.K.local.3", [-1, -1]],
          ["col.A.long.2:row.K.local.4", [9, 67]], ["col.A.local.1:row.K.local.4", [8, 67]], ["col.A.local.5:row.K.local.4", [-1, -1]],
          ["col.A.long.2:row.K.long.2", [6, 67]], ["col.A.local.1:row.K.long.2", [7, 67]], ["col.A.long.3:row.K.long.2", [12, 69]]];
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), pip[1])));
      } else if (this.type == TILE.bottom) {
        var pips = [
          ["col.COL.local.1:row.K.long.1", [23, 68]], ["col.COL.local.4:row.K.long.1", [38, 69]], ["col.COL.long.1:row.K.long.1", [32, 68]], ["col.COL.long.2:row.K.long.1", [32, 67]],
          ["col.COL.long.1:row.K.local.1", [33, 68]],
          ["col.COL.local.5:row.K.local.2", [29, 68]], ["col.COL.long.2:row.K.local.2", [35, 70]],
          ["col.COL.local.5:row.K.local.3", [28, 67]], ["col.COL.long.1:row.K.local.3", [31, 68]],
          ["col.COL.long.2:row.K.local.4", [33, 67]],
          ["col.COL.long.1:row.K.long.2", [30, 69]]];
        this.switch1 = new Switch(this, 1);
        this.switch2 = new Switch(this, 2);
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), [pip[1][0] + xoffset, pip[1][1]])));
      } else if (this.type == TILE.lr) {
        // bottom right
        var pips = [
          ["col.K.long.1:row.K.long.1", [195, 67]], ["col.K.long.2:row.K.long.1", [198, 67]],
          ["col.K.local.1:row.K.local.1", [196, 67]],
          ["col.K.local.2:row.K.local.2", [197, 67]],
          ["col.K.local.3:row.K.local.3", [194, 67]],
          ["col.K.local.4:row.K.local.4", [191, 68]], ["col.K.long.3:row.K.local.4", [192, 67]],
          ["col.K.local.4:row.K.long.2", [191, 67]], ["col.K.long.3:row.K.long.2", [193, 67]]];
        pips.forEach(pip => this.pips.push(new Pip(rename(pip[0]), pip[1])));
      }
    }

    /**
     * Decode this tile from the bitstreamTable.
     * Returns string.
     */
    decode(bitstreamTable) {
      var result = ['tile info'];
      if (this.clb) {
        result.push(this.clb.decode(bitstreamTable));
      }
      if (this.switch1 != null) {
        result.push(this.switch1.decode(bitstreamTable));
        result.push(this.switch2.decode(bitstreamTable));
      }
      this.pips.forEach(pip => result.push(pip.decode(bitstreamTable)));
      this.pins.forEach(pin => result.push(pin.decode(bitstreamTable)));
      return result;
    }

    /**
     * Returns the function of each (known) bit in the bitstreamTable.
     *
     * Format: [[x, y, type], ...]
     */
    getBitTypes() {
      let result = [];
      if (this.clb) {
        result.push(...this.clb.getBitTypes(bitstreamTable));
      }
      if (this.switch1 != null) {
        result.push(...this.switch1.getBitTypes(bitstreamTable));
        result.push(...this.switch2.getBitTypes(bitstreamTable));
      }
      this.pips.forEach(pip => result.push(...pip.getBitTypes(bitstreamTable)));
      this.pins.forEach(pin => result.push(...pin.getBitTypes(bitstreamTable)));
      return result;
    }
  }

  /**
   * A switch matrix.
   * Coordinates: screenPt is the upper left corner of the box. gPt is the coordinate of pin 8.
   */
  class XXXSwitchDecode {
    constructor(tile, num) {
      this.tile = tile; // Back pointer to enclosing tile.
      this.num = num; // 1 or 2
      this.name = tile.name + '.8.' + num;
      this.state = null;
      this.wires = [];

      // The switch pair's upper left wires are local.1
      var row = rowInfo['row.' + this.tile.name[0] + '.local.1'];
      var col = colInfo['col.' + this.tile.name[1] + '.local.1'];
      if (this.tile.type == TILE.bottom) {
        // The bottom switches are mirror-imaged, inconveniently.
        if (num == 1) {
          this.gPt = [col[0] + 3, row[0] + 1];
          this.screenPt = [col[1] - 2, row[1] + 6];
        } else {
          this.gPt = [col[0], row[0] - 2];
          this.screenPt = [col[1] - 2 + 8, row[1] + 6 - 8];
        }
      } else {
        if (num == 1) {
          this.gPt =[col[0], row[0] + 1]
          this.screenPt = [col[1] - 2, row[1] - 2];
        } else {
          this.gPt = [col[0] + 3, row[0] - 2];
          this.screenPt = [col[1] - 2 + 8, row[1] - 2 + 8];
        }
      }
    }

    /**
     * Returns (x, y) screen coordinate for the pin.
     */
    pinCoord(pin) {
        return [this.screenPt[0] + [2, 6, 9, 9, 6, 2, 0, 0][pin],
                this.screenPt[1] + [0, 0, 2, 6, 9, 9, 6, 2][pin]];
    }

    /**
     * Draws the internal wire between pin1 and pin2.
     */
    drawWires(ctx) {
      ctx.beginPath();
      const self = this;
      ctx.strokeStyle = 'blue';
      this.wires.forEach(function([pin1, pin2]) {
        var coord1 = self.pinCoord(pin1);
        var coord2 = self.pinCoord(pin2);
        ctx.moveTo(coord1[0], coord1[1]);
        ctx.lineTo(coord2[0], coord2[1]);
      });
      ctx.stroke();
      
    }

    isInside(x, y) {
      return x >= this.screenPt[0] && x < this.screenPt[0] + 8 && y >= this.screenPt[1] && y < this.screenPt[1] + 8;
    }

    // Helper to remove pins from switches along edges.
    skip(pin) {
      return ((this.tile.type == TILE.top && (pin == 0 || pin == 1)) || (this.tile.type == TILE.bottom && (pin == 4 || pin == 5)) ||
          (this.tile.type == TILE.left && (pin == 6 || pin == 7)) || (this.tile.type == TILE.right && (pin == 2 || pin == 3)));
    }

    decode(bitstreamTable) {

      // bits is a list of [[bitstreamTable x, bitstreamTable y], [pin 1, pin 2]], where the bitstreamTable coordinates are relative to the tile edge.
      if (this.tile.type == TILE.top && this.num == 1) {
        var bits = [[[0, 1], [3, 7]], [[1, 1], [5, 6]], [[3, 1], [2, 7]], [[4, 1], [2, 6]], [[5, 1], [2, 4]], [[0, 2], [5, 7]], [[1, 2], [3, 6]], [[2, 2], [3, 5]], [[4, 2], [4, 6]], [[5, 2], [3, 4]]];
      } else if (this.tile.type == TILE.top && this.num == 2) {
        var bits = [[[13, 2], [3, 7]], [[14, 2], [3, 6]], [[15, 2], [3, 5]], [[16, 2], [4, 6]], [[17, 2], [2, 4]], [[13, 1], [5, 7]], [[14, 1], [5, 6]], [[15, 1], [2, 7]], [[16, 1], [2, 6]], [[17, 1], [3, 4]]];
      } else if (this.tile.type == TILE.left && this.num == 1) {
        var bits = [[[1, 0], [0, 5]], [[2, 0], [3, 5]], [[3, 0], [1, 5]], [[4, 0], [0, 4]], [[5, 0], [1, 4]], [[6, 0], [1, 2]], [[7, 0], [2, 4]], [[8, 0], [3, 4]], [[9, 0], [1, 3]], [[3, 2], [0, 2]]];
      } else if (this.tile.type == TILE.left && this.num == 2) {
        var bits = [[[9, 2], [1, 3]], [[16, 2], [0, 4]], [[14, 0], [1, 5]], [[15, 0], [2, 4]], [[16, 0], [0, 5]], [[17, 0], [3, 5]], [[14, 1], [1, 2]], [[15, 1], [1, 4]], [[16, 1], [0, 2]], [[17, 1], [3, 4]]];
      } else if (this.tile.type == TILE.center && this.num == 1) {
        var bits = [[[0, 0], [0, 6]], [[1, 0], [0, 7]], [[2, 0], [2, 6]], [[3, 0], [2, 7]], [[4, 0], [0, 4]], [[5, 0], [1, 5]], [[6, 0], [1, 2]], [[7, 0], [3, 4]], [[8, 0], [3, 5]], [[0, 1], [5, 6]], [[1, 1], [3, 7]], [[2, 1], [3, 6]], [[3, 1], [1, 7]], [[4, 1], [4, 6]], [[5, 1], [1, 4]], [[6, 1], [1, 3]], [[7, 1], [2, 4]], [[8, 1], [0, 5]], [[0, 2], [5, 7]], [[8, 2], [0, 2]]];
      } else if (this.tile.type == TILE.center && this.num == 2) {
        var bits = [[[9, 0], [4, 6]], [[10, 0], [5, 6]], [[11, 0], [0, 7]], [[12, 0], [0, 4]], [[13, 0], [1, 5]], [[14, 0], [2, 7]], [[15, 0], [3, 7]], [[16, 0], [1, 2]], [[17, 0], [1, 3]], [[9, 1], [1, 4]], [[10, 1], [5, 7]], [[11, 1], [0, 6]], [[12, 1], [0, 5]], [[13, 1], [3, 5]], [[14, 1], [0, 2]], [[15, 1], [3, 6]], [[16, 1], [2, 6]], [[17, 1], [3, 4]], [[9, 2], [1, 7]], [[16, 2], [2, 4]]];
      } else if (this.tile.type == TILE.right && this.num == 1) {
        var bits = [[[5, 0], [1, 5]], [[6, 0], [0, 4]], [[7, 0], [1, 7]], [[8, 0], [4, 6]], [[5, 1], [0, 5]], [[6, 1], [1, 4]], [[7, 1], [0, 7]], [[8, 1], [0, 6]], [[5, 2], [5, 6]], [[6, 2], [5, 7]]];
      } else if (this.tile.type == TILE.right && this.num == 2) {
        var bits = [[[0, 0], [1, 7]], [[1, 0], [0, 4]], [[2, 0], [0, 7]], [[3, 0], [0, 5]], [[4, 0], [0, 6]], [[0, 1], [1, 4]], [[1, 1], [4, 6]], [[2, 1], [5, 7]], [[3, 1], [1, 5]], [[4, 1], [5, 6]]];
      } else if (this.tile.type == TILE.bottom && this.num == 1) {
        var bits = [[[0, 0], [0, 6]], [[1, 0], [2, 7]], [[2, 0], [0, 2]], [[4, 0], [1, 7]], [[5, 0], [1, 2]], [[0, 1], [2, 6]], [[1, 1], [0, 7]], [[3, 1], [3, 6]], [[4, 1], [3, 7]], [[5, 1], [1, 3]]];
      } else if (this.tile.type == TILE.bottom && this.num == 2) {
        var bits = [[[13, 0], [2, 6]], [[14, 0], [2, 7]], [[15, 0], [0, 2]], [[16, 0], [1, 7]], [[17, 0], [1, 3]], [[13, 1], [0, 6]], [[14, 1], [0, 7]], [[15, 1], [3, 6]], [[16, 1], [3, 7]], [[17, 1], [1, 2]]];
      } else {
        throw "Bad switch";
      }

      this.wires = [];
      const self = this;
      bits.forEach(function([[btX, btY], wire]) {
        if (bitstreamTable[self.tile.bitPt[0] + btX][self.tile.bitPt[1] + btY] == 1) {
          self.wires.push(wire);
        }
      });

      this.bitTypes = []
      bits.forEach(function([[btX, btY], wire]) {
        self.bitTypes.push([self.tile.bitPt[0] + btX, self.tile.bitPt[1] + btY, BITTYPE.switch]);
      });
    }

    /**
     * Returns the function of each (known) bit in the bitstreamTable.
     *
     * Format: [[x, y, type], ...]
     */
    getBitTypes() {
      return this.bitTypes;
    }

    info() {
      return "Switch " + this.state + " " + this.wires;
    }
  }

  function initParser() {
    initNames();
    initDecoders();
  }


  var forwardTrace = [];
  var backTrace = [];
  var backError = [];

  function prettyName(name)
  {
    var v = name.split(':');
    switch (v[0])
    {
      case 'IOB':
        return v[1]+'.'+v[2];
      case 'CLB':
        return v[1]+'.'+v[2];
    }

    return name;
  }

  function traceAll()
  {
    for (var p = 1; p <= 84; p++)
    {
      var iob = iobDecoders.getFromPin('P'+p);
      if (typeof iob == 'undefined') continue;

      var name = 'IOB:'+iob.pin+':I';
      iob.routeFromInput();
      visDestList.forEach(dest => {if (backTrace[dest]) backError.push(dest); backTrace[dest] = name;});
    }

    for (var y = 0; y < 10; y++)
    {
      for (var x = 0; x < 10; x++)
      {
        var t = "ABCDEFGHIJ"[y]+"ABCDEFGHIJ"[x];
        var clb = clbDecoders.get(t);
        if (typeof clb == 'undefined') continue;

        var nameX = 'CLB:'+clb.tile+':X';
        var nameY = 'CLB:'+clb.tile+':Y';
        clb.routeFromOutputs();
        forwardTrace[nameX] = [];
        forwardTrace[nameY] = [];
        visDestList.forEach(dest => {if (backTrace[dest]) backError.push(dest); backTrace[dest] = nameX; forwardTrace[nameX].push(dest);});
        visDestList2.forEach(dest => {if (backTrace[dest]) backError.push(dest); backTrace[dest] = nameY; forwardTrace[nameY].push(dest);});
      }
    }

    console.log('-- BACKTRACE DONE --');
    console.log(backTrace);
    console.log(backError);

    var output = "";

    for (var y = 0; y < 10; y++)
    {
      for (var x = 0; x < 10; x++)
      {
        var t = "ABCDEFGHIJ"[y]+"ABCDEFGHIJ"[x];
        var clb = clbDecoders.get(t);

        output += "<h4>---- CLB: "+t+" ----</h4><br>";

        var nameX = 'CLB:'+t+':X';
        var nameY = 'CLB:'+t+':Y';
        if (forwardTrace[nameX].length==0 && forwardTrace[nameY].length==0)
        {
          output += "(unused)<br><br><br>";
        }
        else
        {
          for (var i = 0; i < 4; i++)
          {
            var iname = 'CLB:'+t+':'+("ABCD"[i]);
            if (typeof backTrace[iname] == 'undefined') continue;

            output += prettyName(iname);
            output += " &lt;- ";
            output += prettyName(backTrace[iname]);
            output += "<br>";
          }

          for (var i = 0; i < 2; i++)
          {
            var iname = 'CLB:'+t+':'+("XY"[i]);
            if (forwardTrace[iname].length == 0) continue;

            output += prettyName(iname);
            output += " -&gt; ";
            for (var j = 0; j < forwardTrace[iname].length; j++)
            {
              if (j > 0) output += ", ";
              output += prettyName(forwardTrace[iname][j]);
            }
            output += "<br>";
          }

          output += "<br><br>";
        }
      }
    }

    $('#routeinfo').html(output);
  }
