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
require_once "ticketPrinter.php";
require_once "orderProcessor.php";
require_once "employeeTable.php";
require_once "productsTable.php";
ini_set("memory_limit","1024M");
use Escpos\Printer;
use Escpos\EscposImage;
use Escpos\PrintConnectors\WindowsPrintConnector;

	if (isset($_REQUEST['action']) and $_REQUEST['action']=='printOrder') {
		$type= 'both';
		if (isset($_REQUEST['type'])) $type = $_REQUEST['type'];
		printOrder($_REQUEST['id'],$type);
		$tprtr = null;
	}
	function printOrder($orderNo,$type='both'){
		global $orderActions,$employeeActions,$tprtr,$order,$employeeName;
		$printer ='';
		if (isset($_REQUEST['printer'])) $printer = $_REQUEST['printer'];
		if ($type=='both' or $type=='receipt') $header = true;
		else $header = false;
		$_REQUEST['id'] = $orderNo;
		$order 		= call_user_func($orderActions['getOrder'],true);
		$_REQUEST['id'] = $order['employeeID'];
		$employee 	= call_user_func($employeeActions['getEmployee'],true);
		if ($employee) $employeeName = $employee['name']; 
		else $employeeName='N/A';
		$title = "Order No. ".$order['orderNumber'];
		if ($order['ticketNumber']) $title.=" ({$order['ticketNumber']})";
		$title.= ', ' . $order['orderDate'];
		$tprtr = new TicketPrinter('',$printer,$header);
		if ($type=='both' or $type=='receipt') printReceiptOrder($type);
		if ($type=='both' or $type=='kitchen') printKitchenOrder($type);
		if (substr($order['orderType'],0,4)=='Dine') printTicketNumber();
	}
	function printTicketNumber() {
		global $tprtr,$order;
		$im = imagecreatetruecolor(600, 260);
		$white = imagecolorallocate($im, 255, 255, 255);
		$black = imagecolorallocate($im, 0, 0, 0);
		imagefilledrectangle($im, 0, 0, 600, 260, $white);
		imagefilledrectangle($im, 100, 0, 600-100, 260, $black);
		imagefilledrectangle($im, 102, 2, 600-105, 260-5, $white);
		$num  = str_pad($order['orderNumber'],0,"0",STR_PAD_LEFT);
		// Add the text
		imagettftext($im, 160, 0, 125, 260-60, $black, 'arial.ttf', $num);
		imagettftext($im, 20, 0, 160, 260-20, $black, 'arial.ttf', "O'Neil's Order Number");
		imagepng($im,'ticket.png');
		imagedestroy($im);
		$tux = EscposImage::load("ticket.png", false);
		$tprtr -> feed(1);
		$tprtr->printer -> bitImage($tux);
		$tprtr -> feed(4);
		$tprtr -> cut();
		unlink("ticket.png");
	}
	function printReceiptOrder($type) {
		global $tprtr;
		$tprtr->printer->setLineSpacing(35);
		$tprtr->uppercase = true;
		printOrderHeader();
		printOrderLineItems();
		printOrderTotals();
		$tprtr->footer();
	}
	function printKitchenOrder($type){
		global $tprtr;
		$tprtr->numberOfLines = 0;
		$tprtr->setDoubleSize(true);
		$tprtr->uppercase = true;
		printKitchenHeader();
		printKitchenLineItems();
		$tprtr->text("End of Order",32,'center',Printer::FONT_B,true);
		$tprtr->feed(2);
		$tprtr->insureMinimumPageSize(15);
		$tprtr->cut();
	}
	function printKitchenHeader() {
		global $tprtr,$order,$employeeName;
		$title = "Order No. T".$order['terminalNumber']."-".$order['orderNumber'];
		if ($order['ticketNumber']) $title.=" ({$order['ticketNumber']})";
		$tprtr->text($title,22,"left",Printer::FONT_B,true);
		$match=array();
		preg_match('/\d\d\:\d\d/', $order['orderDate'], $match);
		$tprtr->text($match[0],10,"right",Printer::FONT_B,true);
		$tprtr->feed();
		$secLine = $order['orderType']."  ";
		if ($order['customerName']) $secLine .= "Cust: {$order['customerName']}";
		$tprtr->text($secLine,32,"left",Printer::FONT_B);
		$tprtr->feed();
		if ($order['deliveryTime']) {
			$t = date('m/d/Y h:ia',strtotime($order['deliveryTime']));
			$tprtr->text("Delivery: ".$t,32,"left",Printer::FONT_B);
			$tprtr->feed();
		}
	}
	function printKitchenLineItems() {
		global $tprtr,$order,$productActions;
		foreach($order['menuItems'] as $item) {
			$p = array();
			if ($item['productID'])
				$p = call_user_func($productActions["getProduct"],$item['productID']);
			if (isset($p['prepLocation'])){
				if (intval($p['prepLocation'])==0) continue; 
			}
			$tprtr->text($item['quantity'].' '.$item['product'],32,"left",Printer::FONT_B);
			if ($item['options']) foreach($item['options'] as $option) {
				$tprtr->text('  '.$option['product'],32,"left",Printer::FONT_B);
				$tprtr->feed();
			}
		}
		if ($order['comments']) {
			$tprtr->text("cmt:",5,"left",Printer::FONT_A);
			$c = $order['comments'];
			while ($c){
				$tprtr->text(substr($c,0,32),32,"left",Printer::FONT_B);
				$c = substr($c,32);
				$tprtr->feed();
			}
		}
	}
	function printOrderHeader(){
		global $tprtr,$order,$employeeName;
		$title = "Order No. T".$order['terminalNumber']."-".$order['orderNumber'];
		if ($order['ticketNumber']) $title.=" ({$order['ticketNumber']})";
		$title.= ', ' . $order['orderDate'];
		$tprtr->text($title,47,"center",Printer::FONT_A);
		$tprtr->feed();
		$secLine = $order['orderType']."    ";
		if ($order['customerName']) $secLine .= "Customer: {$order['customerName']}";
		$tprtr->text($secLine,47,"left",Printer::FONT_B);
		$tprtr->feed();
		if ($order['deliveryTime']) {
			$t = date('m/d/Y h:ia',strtotime($order['deliveryTime']));
			$tprtr->text("Delivery Time: $t",0,"left",Printer::FONT_B);
			$tprtr->feed();
		}	
	}
	function printOrderLineItems() {
		global $tprtr,$order;
		$tprtr->text(" ",5,"center",Printer::FONT_A,true);
		$tprtr->text(" ",32,"left",Printer::FONT_A,true);
		$tprtr->text(" ",6,"right",Printer::FONT_A,true);
		$tprtr->feed();
		$tprtr->text("Qty",5,"center",Printer::FONT_A,true);
		$tprtr->text("Description",32,"left",Printer::FONT_A,true);
		$tprtr->text("Price",6,"right",Printer::FONT_A,true);
		$tprtr->feed();
		foreach($order['menuItems'] as $item) {
			$tprtr->text($item['quantity'],5,"center",Printer::FONT_A);
			$tprtr->text($item['product'],32,"left",Printer::FONT_A);
			$total = number_format(floatval($item['price'])*floatval($item['quantity']),2);
			$tprtr->text($total,6,"right",Printer::FONT_A);
			$tprtr->feed();
			if ($item['options']) foreach($item['options'] as $option) {
				$tprtr->text(' ',5,"center",Printer::FONT_A);
				$tprtr->text($option['product'],32,"left",Printer::FONT_A);
				$tprtr->text(number_format(floatval($option['price'])*floatval($item['quantity']),2),6,"right",Printer::FONT_A);
				$tprtr->feed();
			}
		}
		if ($order['comments']) {
			$tprtr->text("cmt:",5,"left",Printer::FONT_A);
			$c = $order['comments'];
			while ($c){
				$tprtr->text(substr($c,0,32),32,"left",Printer::FONT_A);
				$c = substr($c,32);
				$tprtr->feed();
			}
		}
	}
	function printOrderTotals() {
		global $tprtr,$order;
		$tprtr->text(" ",5,"center",Printer::FONT_A,true);
		$tprtr->text(" ",32,"left",Printer::FONT_A,true);
		$tprtr->text(" ",6,"right",Printer::FONT_A,true);
		$tprtr->feed();
		$tprtr->text(" ",5,"center",Printer::FONT_A);
		$tprtr->text("SUBTOTAL: ",32,"right",Printer::FONT_A);
		$tprtr->text(number_format(floatval($order['subtotal']),2),6,"right",Printer::FONT_A);
		$tprtr->feed();
		$tprtr->text(" ",5,"center",Printer::FONT_A);
		$tprtr->text("DISCOUNT: ",32,"right",Printer::FONT_A);
		$tprtr->text(number_format(floatval($order['totalDiscount']),2),6,"right",Printer::FONT_A);
		$tprtr->feed();
		$tprtr->text(" ",5,"center",Printer::FONT_A);
		$tprtr->text("TAX: ",32,"right",Printer::FONT_A);
		$tprtr->text(number_format(floatval($order['tax']),2),6,"right",Printer::FONT_A);
		$tprtr->feed();
		$p='PAYMENT PENDING';
		if ($order['status']=='paid') {
			$p = array();
			if ($order['cashPayment']) $P[]='cash';
			if ($order['checkPayment']) $P[]='check';
			if ($order['creditCardPayment']) $P[]='credit card';
			if ($order['giftCertificatePayment']) $P[]='gift certificate';
			if ($order['corporateCharge']) $P[]='corporate charge';
			if ($order['houseAccountCharge']) $P[]='house account';
			$p="Paid by ".implode(", ",$p);
		}
		$tprtr->text($p,30,"center",Printer::FONT_A);
		$tprtr->text("TOTAL: ",7,"right",Printer::FONT_A);
		$tprtr->text(number_format(floatval($order['total']),2),6,"right",Printer::FONT_A);
		$tprtr->feed();
	}
?>  