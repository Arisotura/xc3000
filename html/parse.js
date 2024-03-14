
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var bitstreams = [];
var curBitstream = null;
var curPackage = null;
var curNetlist = null;


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
          family = i;
        else
          continue;

        // check for XC31xxA extra interconnects
        // if any of these are used, we set the family to XC31xxA, otherwise it is XC30xx
        // only exception is the XC3195A, which has no XC30xx counterpart
        let fam = chipFamilies[family];
        if (fam.extraInter == 2)
          break;

        for (var c = 0; c < fam.cols; c++)
        {
          for (var r = 0; r < fam.rows; r++)
          {
            var extraint = false;

            var basex = 7 + (c * 22);
            var basey = 3+2 + (r * 8);
            if ((r >= (fam.rows/2)) && (!fam.noMidBuffers))
              basey++;

            pos = startpos + ((fnum-1-(basex+7)) * flen) + (flen-1-(basey+3));
            var ec = readbits(1);
            pos = startpos + ((fnum-1-(basex+6)) * flen) + (flen-1-(basey+4));
            ec |= (readbits(3) << 1);

            pos = startpos + ((fnum-1-(basex+13)) * flen) + (flen-1-(basey+2));
            var tb1 = readbits(1);
            pos = startpos + ((fnum-1-(basex+3)) * flen) + (flen-1-(basey+2));
            var tb2 = readbits(1);

            if (ec == 0xB || tb1 == 0 || tb2 == 0)
            {
              extraint = true;
              break;
            }
          }
          if (extraint) break;
        }

        if (!(extraint ^ (fam.extraInter==1)))
          break;

        family = -1;
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
  selectPackage(pkgid);

  initParser();
  decode();
}

function selectPackage(pkgid)
{
  curPackage = chipPackages[curBitstream.family.base][pkgid];

  if (iobDecoders)
    iobDecoders.onChangePackage();
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

function initDecoders()
{
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
}

function decode()
{
  decoders.forEach(d => d.decode());

  netColor = 120;
  clbDecoders.traceFromOutputs();
  iobDecoders.traceFromOutputs();
  clockDecoders.traceFromOutputs();
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

