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
require_once "optionsTable.php";
require_once "TicketPrinter.php";
use Escpos\Printer;
use Escpos\PrintConnectors\WindowsPrintConnector;
	function getTillTotals($till) {
		global $db,$tillTotals,$_date;
		$query = "select entryType, count(*) as 'count', sum(amount) as 'amount' from tills ".
				 "where DATE(date) = '".$_date."' and tillName = 'till$till' ".
				 "group by entryType;";
		$result = $db->query($query);
		$tillTotals = array('count'=>0);
		while($row = $result->fetch_assoc()) {
			$tillTotals[$row['entryType']] = $row['amount'];
			$tillTotals['count']+=1;
		}
		return $tillTotals;		 
	}
	function getTillDetail($till,$entryType) {
		global $db,$_date;
		$query = "select * from tills ".
				 "where DATE(date) = '".$_date."' and tillName = 'till$till' ".
				 "and entryType = '$entryType';";
		$result = $db->query($query);
		return   $result->fetch_all(MYSQLI_ASSOC);
	}
	function printTillDetail($tPrtr,$tillNumber,$tTotals,$entryType,$description,$detail=false){
		if (isset($tTotals[$entryType])) $to = number_format($tTotals[$entryType],2); else $to = "0.00";
		if ($detail and isset($tTotals[$entryType])) {
			$description .= ' Total';
			$det = getTillDetail($tillNumber,$entryType);
			foreach ($det as $item) {
				$too = number_format($item['amount'],2);
				$tPrtr->text("    {$item['reference']} {$item['description']}",47,"left",Printer::FONT_B);
				$tPrtr->text($too,6,"right",Printer::FONT_B);
				$tPrtr->feed(1);
			}
		}
		$tPrtr->text($description,41,"left",Printer::FONT_A);
		$tPrtr->text($to,6,"right",Printer::FONT_A);
		$tPrtr->feed(1);
	}
	function printTill($tPrtr,$tTotals,$tillNumber) {
		$tPrtr->text("Till $tillNumber Report",47,"center",Printer::FONT_A);
		$tPrtr->feed(1);
		printTillDetail($tPrtr,$tillNumber,$tTotals,'tillOpen',"Open Till");
		printTillDetail($tPrtr,$tillNumber,$tTotals,'order-cash',"Cash Payments");
		printTillDetail($tPrtr,$tillNumber,$tTotals,'order-check',"Check Payments");
		printTillDetail($tPrtr,$tillNumber,$tTotals,'order-gift',"Gift Card Payments");
		printTillDetail($tPrtr,$tillNumber,$tTotals,'add',"Till Add",true);
		printTillDetail($tPrtr,$tillNumber,$tTotals,'drop[',"Till Drop",true);
		printTillDetail($tPrtr,$tillNumber,$tTotals,'vendor',"Till Vendor",true);
		if (isset($tTotal['tillClose'])) 
			printTillDetail($tPrtr,$tillNumber,$tTotals,'tillClose',"Till Close");
		$total=0;
		foreach ($tTotals as $key=>$item) {
			if ($key=='count') continue;
			$total+=floatval($item);
		}
		$tPrtr->text(' ',47,"left",Printer::FONT_A,true);
		$tPrtr->feed(1);
		$tPrtr->text("Till $tillNumber Total",41,"left",Printer::FONT_A);
		$tPrtr->text(number_format($total,2),6,"right",Printer::FONT_A);
		$tPrtr->feed(2);
	}
	if (!isset($_REQUEST['till'])) {
		posLog("No Till Specified on Till Print Request");
		$jTableResult = array();
		$jTableResult['Result']  = "ERROR";
		$jTableResult['Message'] = "No Till Specified on Till Print Request";
		print json_encode($jTableResult);
		exit;
	}
	$tillNumber = preg_replace("/[^0-9]/","",$_REQUEST['till']);
	if (!SQLConnect()) print "<br>SQLConnect Error";
	if (isset($_REQUEST['date'])) $_date = date('Y-m-d',strtotime($_REQUEST['date']));
	else $_date = date('Y-m-d');
	$d = date("m/d/Y",strtotime($_date));
	$posTerminal=call_user_func($optionsActions['getValue'],'tprtr1');
	$tPrtr = new TicketPrinter("Daily Close Report for $d",$posTerminal);
	$tPrtr->feed(1);
	$tTotals = getTillTotals($tillNumber);
	if ($tTotals['count']==0) continue;
	printTill($tPrtr,$tTotals,$tillNumber);
	$jTableResult = array();
	$jTableResult['Result']  = "OK";
	print json_encode($jTableResult);

?>