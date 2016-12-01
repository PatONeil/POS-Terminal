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
	$till_Totals = array();
	for ($i=0;$i<10;$i++) $till_Totals[$i]=0;
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
		$total = $salesTotals['total'];
		foreach ($salesTotals as $key=>$item) {
			if ($key == 'orders') continue;
			if ($key != 'total') $paid += floatval($item);
			$salesTotals[$key] = number_format($item,2);
		}
		
		$salesTotals['unpaid'] = number_format(floatval($total)-$paid,2);
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
	function printTillDetail($i,$tTotals,$entryType,$description,$detail=false){
		global $db;
		$html = '';
		if (isset($tTotals[$entryType])) $to = number_format($tTotals[$entryType],2); else $to = "0.00";
		if ($entryType=='tillOpen' and $to=='0.00') {
			// if last entry from previous day is Till Open, include that amount in report.
			$date = date("Y-m-d",strtotime('-1 day'));
			$result = $db->query("select * from tills where tillName = 'till$i' and DATE(date)='$date' order by ID desc limit 1");
			if ($result) {
				$row = $result->fetch_assoc();
				if ($row['entryType']=='tillOpen') $to = number_format($row['amount'],2);
				$tillTotals[$row['entryType']] = $row['amount'];
			}
		}
		if ($detail and isset($tTotals[$entryType])) {
			$description .= ' Total';
			$det = getTillDetail($i,$entryType);
			foreach ($det as $item) {
				$too = number_format($item['amount'],2);
				$html .= '	<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - '."{$item['reference']} {$item['description']}".'</td><td style="text-align:right;">'.$too.'</td></tr>';
			}
		}
		$html .= '	<tr><td>'.$description.'</td><td style="text-align:right;">'.$to.'</td></tr>';
		return $html;
	}
	function printTill($tTotals,$i) {
		global $till_Totals;
		$html = '';
		$html .= '<h2 style="text-align:center;">Till '.$i.' Report</h2>';
		$html .= '<table style="width:400px;"><tbody>';
		$html .= 	printTillDetail($i,$tTotals,'tillOpen',"Open Till",true);
		$html .= 	printTillDetail($i,$tTotals,'tillClose',"Close Till",true);
		$html .= 	printTillDetail($i,$tTotals,'order-cash',"Cash Payments");
		$html .= 	printTillDetail($i,$tTotals,'order-check',"Check Payments");
		$html .= 	printTillDetail($i,$tTotals,'order-gift',"Gift Card Payments");
		$html .= 	printTillDetail($i,$tTotals,'add',"Till Add",true);
		$html .= 	printTillDetail($i,$tTotals,'drop',"Till Drop",true);
		$html .= 	printTillDetail($i,$tTotals,'vendor',"Till Vendor",true);
//		if (isset($tTotal['tillClose'])) 
//			$html .= printTillDetail($i,$tTotals,'tillClose',"Till Close");
		$total=0;
		foreach ($tTotals as $key=>$item) {
			if ($key=='count') continue;
			$total+=floatval($item);
		}
		$till_Totals[$i] = $total;
		$html .= '	<tr><td colspan="2"><hr></td></tr>';
		$html .= '	<tr><td>Till '.$i.' Total</td><td style="text-align:right;">'.number_format($total,2).'</td></tr>';
		$html .= '</tbody></table>';
		return $html;
	}
	function printTotalTills(){
		$html = '';
		for ($i=1;$i<10;$i++) {
			$tTotals = getTillTotals($i);
			if ($tTotals['count']==0) continue;
			$html .= printTill($tTotals,$i);
		}
		return $html;
	}
	function printSalesTotal($sales) {
		$html = '';
		$html .= '<h2 style="text-align:center;">Daily Sales Report</h2>';
		$html .= '<table style="width:400px;"><tbody>';
		$html .= '	<tr><td>Total Orders</td><td style="text-align:right;">'.$sales['orders'].'</td></tr>';
		$html .= '	<tr><td>Cash Sales</td><td style="text-align:right;">'.$sales['cashTotal'].'</td></tr>';
		$html .= '	<tr><td>Check Total</td><td style="text-align:right;">'.$sales['checkTotal'].'</td></tr>';
		$html .= '	<tr><td>Credit Card Sales</td><td style="text-align:right;">'.$sales['creditTotal'].'</td></tr>';
		$html .= '	<tr><td>Gift Certificate Redemptions</td><td style="text-align:right;">'.$sales['giftTotal'].'</td></tr>';
		$html .= '	<tr><td>House Account Sales</td><td style="text-align:right;">'.$sales['houseTotal'].'</td></tr>';
		$html .= '	<tr><td>Corporate Charge Sales</td><td style="text-align:right;">'.$sales['corporateTotal'].'</td></tr>';
		$html .= '	<tr><td>Unpaid Sales</td><td style="text-align:right;">'.$sales['unpaid'].'</td></tr>';
		$html .= '	<tr><td colspan="2"><hr></td></tr>';
		$html .= '	<tr><td>TOTAL</td><td style="text-align:right;">'.$sales['total'].'</td></tr>';
		$html .= '</tbody></table>';
		return $html;
	}
	if (!SQLConnect()) print "<br>SQLConnect Error";
	if (isset($_REQUEST['date'])) $_date = date('Y-m-d',strtotime($_REQUEST['date']));
	else $_date = date('Y-m-d');
	$d = date("m/d/Y",strtotime($_date));
	$sales = getSalesTotal();
	$html = '<h1 style="text-align:center;margin-bottom:0px;">Daily Sales Report for '.$d.'</h1>';
	$html .= '<div style="width:965px;float:left;margin-left:50px;height:550px;overflow-y:auto;">';
	$html .= '	<div style="width:440px;margin-right:40px;float:left;">';
	$html .=		printSalesTotal($sales);
	$html .= '	</div>';
	$html .= '	<div style="width:440px;float:left;">';
	$html .=		printTotalTills();
	$html .= '	</div>';
	$html .= '</div>';
	$html .= '<div id="clButtons"style="float:left;margin-top:10px;width:100%;height:50px;border-top:2px solid #5c9ccc;text-align:center;padding-top:5px;">';	
	$html .= '	<div class="actionButton" style="float:right;margin:4px;width:100px;height:24px;">';
	$html .= '		<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
	$html .= '			Done';
	$html .= '		</div>';
	$html .= '	</div>';
	$html .= '	<div class="actionButton" style="float:right;margin:4px;width:100px;height:24px;">';
	$html .= '		<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
	$html .= '			Close Tills';
	$html .= '		</div>';
	$html .= '	</div>';
	$html .= '	<div class="actionButton" style="float:right;margin:4px;width:100px;height:24px;">';
	$html .= '		<div style="position: relative;top: 50%;transform: perspective(1px) translateY(-50%);">';
	$html .= '			Print';
	$html .= '		</div>';
	$html .= '	</div>';
	$html .= '</div>';
	print $html;
	print '<script>';
	print '	 posTerminal.posCloseReport.tillTotals = ' . json_encode($till_Totals);
	print '</script>';
	
?>