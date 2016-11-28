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

require_once "connectPOS.php";
require "../Escpos/autoload.php";
use Escpos\Printer;
use Escpos\PrintConnectors\WindowsPrintConnector;
/* line lengths FONT_A=47, FONT_B = 63 */
class TicketPrinter {
	private $heading = "";
	private $fieldHeadings = array();
	private $fieldSizes = array();
	private $fieldAlignment = array();
	private $font = Printer::FONT_B;
	public  $doubleSize = false;
	private $options = array();
	public  $printer;
	public  $uppercase = false;
	public  $numberOfLines = 0;

	function __construct($title='',$printer="",$printHeader=true) {
		global $db;
		SQLConnect();
		$query = "SELECT * FROM options;";
		$result = $db->query($query);
		if (!$result) {
			posLog("Error in query\n $query");
			$jTableResult = array();
			$jTableResult['Result']  = "ERROR";
			$jTableResult['Message'] = "error in MySQL!!!";
			print json_encode($jTableResult);
			exit;
		}
		$rows   =  $result->fetch_all(MYSQLI_ASSOC); 
		foreach($rows as $row) $this->options[$row['key']]=$row;
		if (!$printer) $printer = $this->options['tprtr1']['value'];
		$this->connector = new WindowsPrintConnector($printer);
		$this->printer = new Printer($this->connector);
		$this->printer->selectPrintMode(Printer::MODE_EMPHASIZED);
		if ($printHeader) $this->header($title);
	}
	function __destruct() {
//	   if ($this->footer) $this->footer();
	   $this->printer->close();
	}
    public function header ($title) {
		$this->text($this->options['company']['value'],47,"center",Printer::FONT_A);
		$this->feed();
		$this->text($this->options['address']['value'].'  '.$this->options['cityStateZip']['value'],50,"left",Printer::FONT_B);
		$this->text($this->options['phone']['value'],13,"right",Printer::FONT_B);
		$this->feed(2);
		if ($title){
			$this->text($title,47,"center",Printer::FONT_A);
		}
		$this->feed();
	}
	public function insureMinimumPageSize($size=0) {
		if (!isset($size)) $size = intval($this->options['tlen1']['value']);
		if ($this->numberOfLines<$size-1) 
			$this->feed($size-$this->numberOfLines-1);
	}
	public function cut($linesAfter=3) {
		$this->printer->cut(Printer::CUT_FULL,$linesAfter);
	}
    public function footer () {
		$this->feed(3);
		$this->insureMinimumPageSize(3);
		$this->text($this->options['msg1']['value'],31,"left",Printer::FONT_B);
		$this->text($this->options['msg2']['value'],31,"right",Printer::FONT_B);
		$this->feed(2);
		$this->cut(1);
    }
	public function setDoubleSize($size = true) {
		if ($size) $this->printer->selectPrintMode(Printer::MODE_EMPHASIZED|Printer:: MODE_DOUBLE_WIDTH|Printer:: MODE_DOUBLE_HEIGHT);
		else       $this->printer->selectPrintMode(Printer::MODE_EMPHASIZED);
		$this->doubleSize = $size;
	}
	public function setFieldSizes($data) {
		if (!$data) return false;
		if (!is_array($data)) return false;
		$this->fieldSizes = $data;
	}
	public function setFieldHeadings($data) {
		if (!$data) return false;
		if (!is_array($data)) return false;
		$this->fieldHeadings = $data;
	}
	public function setFieldAlignment($data) {
		if (!$data) return false;
		if (!is_array($data)) return false;
		$this->fieldAlignment = $data;
	}
	public function setRecordFont($font=Printer::FONT_B) {
		$this->font = $font;
	}
	public function printRecords($_records) {
	}
	public function text($text,$size=0,$alignment="left",$font=Printer::FONT_B,$underline=false){
		if ($size==0) $size=strlen($text);
		if (strlen($text)> $size) $text =substr($text,0,$size);
		if ($this->uppercase) $text = strtoupper($text);
		switch($alignment) {
			case 'left':
				if (strlen($text)<$size) $text=str_pad($text,$size);
				break;
			case 'right':
				if (strlen($text)<$size) $text=str_pad($text,$size,' ',STR_PAD_LEFT);
				break;
			case 'center':
				if (strlen($text)<$size) {
					$l=strlen($text);
					$lp = $l+round(($size - $l)/2);
					$text=str_pad($text,$lp,' ',STR_PAD_LEFT);
					$text=str_pad($text,$size);
				}
				break;
		}
		$mode = Printer::MODE_EMPHASIZED;
		if ($underline) 		$mode|=Printer::MODE_UNDERLINE;
		if ($this->doubleSize)  $mode|=Printer::MODE_EMPHASIZED|Printer:: MODE_DOUBLE_WIDTH|Printer:: MODE_DOUBLE_HEIGHT;
		$this->printer->selectPrintMode($mode);
		$this->printer->setFont($font);
		$this->printer->text($text);
	}
	public function feed($lines=1) {
		$this->numberOfLines+=$lines;
		$this->printer->feed($lines);
	}
}
//$tprtr = new TicketPrinter("title");
?>