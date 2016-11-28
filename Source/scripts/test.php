<?php
/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright (c) 2016 Patrick J. O'Neil (http://www.pjoneil.net)
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */

require "../Escpos/autoload.php";
use Escpos\Printer;
use Escpos\EscposImage;
use Escpos\PrintConnectors\FilePrintConnector;
use Escpos\PrintConnectors\WindowsPrintConnector;
$width = 600;
$height= 260;
$fontSize = 120;
$im = imagecreatetruecolor($width, $height);
$white = imagecolorallocate($im, 255, 255, 255);
$black = imagecolorallocate($im, 0, 0, 0);
imagefilledrectangle($im, 0, 0, $width, $height, $white);
imagefilledrectangle($im, 100, 0, $width-100, $height, $black);
imagefilledrectangle($im, 102, 2, $width-105, $height-5, $white);

$text = '003';
$font = 'arial.ttf';
// Add the text
imagettftext($im, 160, 0, 125, $height-$fontSize/2, $black, $font, $text);
imagettftext($im, 20, 0, 160, $height-20, $black, $font, "O'Neil's Order Number");
imagepng($im,'ticket.png');
imagedestroy($im);


print "starting test";

$connector = new WindowsPrintConnector("POS-80");
$printer = new Printer($connector);
try {
    $tux = EscposImage::load("ticket.png", false);
    
    $printer -> bitImage($tux);
    $printer -> feed(4);
    
    $printer -> cut();
} catch (Exception $e) {
    // Images not supported on your PHP, or image file not found 
    $printer -> text($e -> getMessage() . "\n");
}
$printer -> close();


print "<br>ending test";

//require_once "connectPOS.php";

?>