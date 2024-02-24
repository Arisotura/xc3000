const XSIZE = 7; // Each digit is a XSIZE x YSIZE block.
const YSIZE = 9;
  /**
   * Displays the bitstream data.
   */
  function drawBitstream(ctx, bitstream) {
    $("#bitstreamSpan").css('display', 'inline');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (bitstream == null) {
      return;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    const HEIGHT = YSIZE * 87 + 3;
    const WIDTH = XSIZE * 196 + 3;
    ctx.canvas.height = HEIGHT;
    ctx.canvas.width = WIDTH;
    $("#container").css('height', HEIGHT + 'px');
    $("#container").css('width', WIDTH + 'px');
    $("#info").css('margin-left', WIDTH + 'px');
    $("#info3").css('margin-left', '0px');
    $("#info3").css('clear', 'both');

    if ($("#colors").is(":checked")) {
      drawBg(ctx);
    }

    // Draw labels and boxes
    ctx.font = "45pt arial";
    var xpos = 3; // 3 bits to first cell.
    ctx.strokeStyle = "#ccc";
    ctx.beginPath();
    ctx.rect(0, 0, 196 * XSIZE, 87 * YSIZE);
    ctx.stroke();
    ctx.strokeStyle = "#fbb";
    ctx.beginPath();
    ctx.fillStyle = "#00f";
    for (var x = 0; x < 10; x++) {
      if (x == 4 || x == 7) {
        xpos += 2; // Skip buffer
      }
      var ypos = 1; // 1 bit to first cell
      for (var y = 0; y < 10; y++) {
        if (y == 4 || y == 7) {
          ypos += 1; // Skip buffer
        }
        if ($("#labels").is(":checked")) {
          ctx.globalAlpha = 0.2;
          fillText(ctx, "ABCDEFGHIJ"[y] + "ABCDEFGHIJ"[x], 25 + xpos * XSIZE, 57 + ypos * YSIZE);
          ctx.globalAlpha = 1;
        }
        ctx.rect(xpos * XSIZE, ypos * YSIZE, 18 * XSIZE, 8 * YSIZE);
        ypos += 8; // 8 bits per tile
      }
      xpos += 18; // 18 bits per tile
    }
    ctx.stroke();

    // Draw data
    $("#img").css('opacity', 0);
    ctx.font = "8pt arial";
    ctx.fillStyle = "black";
    for (var x = 0; x < 196; x++) {
      for (var y = 0; y < 87; y++) {
        const bit = bitstream[x][y] ^ 1; // Invert bit back from bitstream value (activ 1) to RBT value (active 0).
        if (getDefaultBit(x, y) != bit) {
          ctx.fillStyle = '#ccc';
          fillText(ctx, bit == 0 ? '0' : '1', 1 + x * XSIZE - 2, 8 + y * YSIZE);
        } else {
          ctx.fillStyle = 'black';
          fillText(ctx, bit, x * XSIZE - 1, YSIZE + y * YSIZE);
        }
      }
    }
    $("#settings").text(otherDecoder.info());
  }

  /**
   * Color the background of the bit display according to function.
   */
  function drawBg(ctx) {
    for (let i = 0; i < 196 * 87; i++) {
      let type = bitTypes[i];
      let y = 86 - (i % 87);
      let x = 195 - Math.floor(i / 87);
      const n = (195 - x) * 87 + (86 - y);
      // Color by categories.
      //assert(type);
      if (type == BITTYPE.lut) {
        ctx.fillStyle = '#fcc';
      } else if (type == BITTYPE.clb) {
        ctx.fillStyle = '#cfc';
      } else if (type == BITTYPE.pip) {
        ctx.fillStyle = '#0cf';
      } else if (type == BITTYPE.mux) {
        ctx.fillStyle = '#000';
      } else if (type == BITTYPE.switch) {
        ctx.fillStyle = '#fcf';
      } else if (type == BITTYPE.iob) {
        ctx.fillStyle = '#ffc';
      } else if (type == BITTYPE.bidi) {
        ctx.fillStyle = '#eb8';
      } else if (type == BITTYPE.other) {
        ctx.fillStyle = '#888';
      } else if (type == BITTYPE.unused) {
        ctx.fillStyle = '#fff';
      } else {
        assert(0, "bad type " + type);
      }
      ctx.fillRect(x * XSIZE, y * YSIZE, XSIZE, YSIZE);
    }
  }

  // Processes a mouse-over on the bitstream image
  function bitstreamMouse(x, y) {
    if (config == null) {
      return;
    }
    const xn = Math.trunc(x / XSIZE); // Convert to bit indices
    const yn = Math.trunc(y / YSIZE);
    const n = (195 - xn) * 87 + (86 - yn);
    $("#info3").html('Bit ' + n + ' = ' + rawBitstream[n] + ": " + config[n]);
  }

// Default bitstream for an empty configuration, encoded as 32-bit ints for compactness
const empty = [[2743085280, 3758263808, 10715176, 685769358, 41856, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 0, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 3221225472, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 3221225472, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 3221225472, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 0, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 3221225472, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [1082134562, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 3221225472, 0], [1073745922, 65536, 4194320, 268435712, 671105024, 0], [1, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [2, 0, 0, 0, 0, 0], [1082134560, 536936960, 4227088, 270532866, 16512, 0], [0, 0, 0, 0, 3221225472, 0], [1073745920, 65536, 4194320, 268435712, 16384, 0], [0, 0, 0, 0, 2147483648, 0], [0, 0, 0, 0, 1073741824, 0], [0, 0, 0, 0, 0, 0], [2743085286, 3758263808, 10715176, 685769358, 41856, 0]];

function getDefaultBit(x, y) {
  return 1;//(empty[y][Math.floor(x / 32)] & (1 << (x % 32))) ? 1 : 0;
}

function getDemoBit(x, y) {
  return (twarp[y][Math.floor(x / 32)] & (1 << (x % 32))) ? 1 : 0;
}

function makeDemoBitstream() {
  /*for (var x = 0; x < 196; x++) {
    for (var y = 0; y < 87; y++) {
      const n = (159 - x) * 71 + (70 - y);
      rawBitstream[n] = 1 - getDemoBit(x, y);
      
    }
  }
  bitstreamTable = makeBitstreamTable(rawBitstream, false /* invert *-/);
  return rawBitstream;*/
  $.ajax({
    url: 'prom.rbt',
    success: function(data) {
      rbtParse(data);
    },
    dataType: 'text',
    async: false
  });
  return rawBitstream;
}

