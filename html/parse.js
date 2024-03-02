
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
  decoders.forEach(d => d.decode());
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



  function initParser() {
    initNames();
    initDecoders();
  }

  function getTileOffset(col, row)
  {
    ret = {};
    ret.x = 7 + (col * 22);
    ret.y = 3 + 2 + (row * 8);
    if (!curBitstream.family.noMidBuffers)
    {
      if (row >= (curBitstream.family.rows/2))
        ret.y++;
    }

    return ret;
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
