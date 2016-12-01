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
	function getSalesTotal() {
		global $db,$salesTotals,$_date;
		$query = "select count(*) as 'orders', sum(total) as 'total', ".
				 "sum(cashPayment) as cashTotal, sum(checkPayment) as checkTotal, ".
				 "sum(creditCardPayment) as creditTotal, sum(giftCertificatePayment) as giftTotal, ".
				 "sum(corporateCharge) as corporateTotal, sum(houseAccountCharge) as houseTotal ".
				 "from orders where Date(orderDate) = '".$_date."';";
		$result = $db->query($query);
		$salesTotals = $result->fetch_assoc();
		$paid = 0;
		$total = floatval($salesTotals['total']);
		foreach ($salesTotals as $key=>$item) {
			if ($key == 'orders') continue;
			if ($key != 'total') $paid += floatval($item);
			$salesTotals[$key] = number_format($item,2);
		}
		$salesTotals['unpaid'] = number_format(($total - $paid),2);
		return $salesTotals;
	}
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
	function printTillDetail($tPrtr,$i,$tTotals,$entryType,$description,$detail=false){
		global $db;
		if (isset($tTotals[$entryType])) $to = number_format($tTotals[$entryType],2); else $to = "0.00";
		if ($entryType=='tillOpen' and $to=='0.00') {
			// if last entry from previous day is Till Open, include that amount in report.
			$date = date("Y-m-d",strtotime('-1 day'));
			$result = $db->query("select * from tills where tillName = 'till$i' and DATE(date)='$date' order by ID desc limit 1");
			if ($result) {
				$row = $result->fetch_assoc();
				if ($row['entryType']=='tillOpen') $to = number_format($row['amount'],2);
			}
		}
		if ($detail and isset($tTotals[$entryType])) {
			$description .= ' Total';
			$det = getTillDetail($i,$entryType);
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
	function printTill($tPrtr,$tTotals,$i) {
		$tPrtr->text("Till $i Report",47,"center",Printer::FONT_A);
		$tPrtr->feed(1);
		printTillDetail($tPrtr,$i,$tTotals,'tillOpen',"Open Till Summary");
		printTillDetail($tPrtr,$i,$tTotals,'tillClose',"Close Till Summary");
		printTillDetail($tPrtr,$i,$tTotals,'order-cash',"Cash Payments");
		printTillDetail($tPrtr,$i,$tTotals,'order-check',"Check Payments");
		printTillDetail($tPrtr,$i,$tTotals,'order-gift',"Gift Card Payments");
		printTillDetail($tPrtr,$i,$tTotals,'add',"Till Add Summary",true);
		printTillDetail($tPrtr,$i,$tTotals,'drop[',"Till Drop Summary",true);
		printTillDetail($tPrtr,$i,$tTotals,'vendor',"Till Vendor Summary",true);
//		if (isset($tTotal['tillClose'])) 
//			printTillDetail($tPrtr,$i,$tTotals,'tillClose',"Till Close");
		$total=0;
		foreach ($tTotals as $key=>$item) {
			if ($key=='count') continue;
			$total+=floatval($item);
		}
		$tPrtr->text(' ',47,"left",Printer::FONT_A,true);
		$tPrtr->feed(1);
		$tPrtr->text("Till $i Total",41,"left",Printer::FONT_A);
		$tPrtr->text(number_format($total,2),6,"right",Printer::FONT_A);
		$tPrtr->feed(2);
	}
	function printSalesDetail($tPrtr,$description,$value) {
		$tPrtr->text($description,41,"left",Printer::FONT_A);
		$tPrtr->text($value,6,"right",Printer::FONT_A);
		$tPrtr->feed(1);
	}
	function printSalesTotal($tPrtr,$sales) {
		$tPrtr->text("Daily Sales Report",47,"center",Printer::FONT_A);
		$tPrtr->feed(1);
		printSalesDetail($tPrtr,"Total Orders",$sales['orders']);
		printSalesDetail($tPrtr,"Cash Sales",$sales['cashTotal']);
		printSalesDetail($tPrtr,"Check Sales",$sales['checkTotal']);
		printSalesDetail($tPrtr,"Credit Card Sales",$sales['creditTotal']);
		printSalesDetail($tPrtr,"Gift Certificate Redemptions",$sales['giftTotal']);
		printSalesDetail($tPrtr,"House Account Sales",$sales['houseTotal']);
		printSalesDetail($tPrtr,"Corporate Charge Sales",$sales['corporateTotal']);
		printSalesDetail($tPrtr,"Unpaid Sales",$sales['unpaid']);
		$tPrtr->text(' ',47,"left",Printer::FONT_A,true);
		$tPrtr->feed(1);
		printSalesDetail($tPrtr,"TOTAL",$sales['total']);
		$tPrtr->feed(1);
	}

	if (!SQLConnect()) print "<br>SQLConnect Error";
	if (isset($_REQUEST['date'])) $_date = date('Y-m-d',strtotime($_REQUEST['date']));
	else $_date = date('Y-m-d');
	$d = date("m/d/Y",strtotime($_date));
	$posTerminal=call_user_func($optionsActions['getValue'],'tprtr1');
	$tPrtr = new TicketPrinter("Daily Close Report for $d",$posTerminal);
	$tPrtr->feed(1);
	$sales = getSalesTotal();
	printSalesTotal($tPrtr,$sales);
	for ($i=1;$i<10;$i++) {
		$tTotals = getTillTotals($i);
		if ($tTotals['count']==0) continue;
		printTill($tPrtr,$tTotals,$i);
	}
	$tPrtr->feed(15);
	$tPrtr->cut();
	$jTableResult = array();
	$jTableResult['Result']  = "OK";
	print json_encode($jTableResult);

?>