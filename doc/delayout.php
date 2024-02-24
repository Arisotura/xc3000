<?php

for ($cnt = 1; $cnt < count($argv); $cnt++)
{
printf("processing file %d: %s\n", $cnt, $argv[$cnt]);
$lines = file_get_contents($argv[$cnt]);
//if (!$lines) die('nothing');
if (!$lines)
{
    printf("nothing\n");
    continue;
}
$lines = explode("\n", $lines);

// 92x241
$bitstream = array();
//$xspaces = array(7, 29, 51, 73, 95, 117, 119, 141, 163, 185, 207, 229);
$xspaces = array(7, 29, 51, 73, 95, 117, 139, 161, 183, 205, 227);
$yspaces = array(3, 5, 13, 21, 29, 37, 45, 46, 54, 62, 70, 78, 86, 91);

$j = 0;
foreach ($lines as $line)
{
    $line = trim($line);
    if (strlen($line) != 92) continue;

    for ($i = 0; $i < 92; $i++)
    {
        $y = 91 - $i;
        $x = 240 - $j;
        $bitstream[($y*241)+$x] = $line[$i];
    }

    $j++;
}

$out = '';

for ($y = 0; $y < 92; $y++)
{
    if (in_array($y, $yspaces)) $out .= "\n";

    for ($x = 0; $x < 241; $x++)
    {
        if (in_array($x, $xspaces)) $out .= ' ';
        $out .= $bitstream[($y*241)+$x];
    }

    $out .= "\n";
}

file_put_contents($argv[$cnt].'.del', $out);
}
echo "done\n";

