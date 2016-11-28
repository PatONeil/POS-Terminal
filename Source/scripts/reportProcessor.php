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

	if (!SQLConnect()) print "<br>SQLConnect Error";
	$actions = array(
		'dailySales' =>function() {
			global $db;
			$date = date("Y-m-d",strtotime('last month'));
			$query="select Date(orderDate) as date,count(*) as 'orders', sum(total) as 'total', ".
				  "sum(cashPayment) as cash, sum(checkPayment) as checks, ".
				  "sum(creditCardPayment) as credit, sum(giftCertificatePayment) as gift, ".
				  "sum(corporateCharge) as corporate, sum(houseAccountCharge) as house ".
				  "from orders where Date(orderDate) > '$date' group by Date(orderDate) order by Date(orderDate) desc;";
			$result = $db->query($query);
			if (!$result) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$rows =  $result->fetch_all(MYSQLI_ASSOC);
			$html = ''; 
			$html.= '<div style="float:left;margin:0px 20px;width:100%">';
			$html.= ' <h1>Daily Sales Report for Last 30 Days</h1>';
			$html.= ' <table style="width:900px">';
			$html.= '   <thead><tr>';
			$html.= '   <th style="text-align:left;width:170px">Date</th>';
			$html.= '   <th style="text-align:center;width:50px;">Count</th>';
			$html.= '   <th style="text-align:right;width:100px;">Cash</th>';
			$html.= '   <th style="text-align:right;width:100px;">Checks</th>';
			$html.= '   <th style="text-align:right;width:100px;">Credit<br>Card</th>';
			$html.= '   <th style="text-align:right;width:100px;">Gift<br>Certificates</th>';
			$html.= '   <th style="text-align:right;width:100px;">House<br>Accounts</th>';
			$html.= '   <th style="text-align:right;width:100px;">Corporate<br>Charge</th>';
			$html.= '   <th style="text-align:right;width:100px;">Total</th>';
			$html.=' 	</tr></thead><tbody>';
			foreach ($rows as $row) {
				$html.='<tr>';
					$html.="<td style='text-align:left'>".$row['date']."</td>";
					$html.="<td style='text-align:center'>".$row['orders']."</td>";
					$html.="<td style='text-align:right'>".number_format((float)$row['cash'], 2)."</td>";
					$html.="<td style='text-align:right'>".number_format((float)$row['checks'], 2)."</td>";
					$html.="<td style='text-align:right'>".number_format((float)$row['credit'], 2)."</td>";
					$html.="<td style='text-align:right'>".number_format((float)$row['gift'], 2)."</td>";
					$html.="<td style='text-align:right'>".number_format((float)$row['house'], 2)."</td>";
					$html.="<td style='text-align:right'>".number_format((float)$row['corporate'], 2)."</td>";
					$html.="<td style='text-align:right'><b>".number_format((float)$row['total'], 2)."</b></td>";
				$html.='</tr>';
			}
			$html.=' </tbody></table>';
			$html.= '</div>';
			$jTableResult = array();
			$jTableResult['Result']  = "OK";
			$jTableResult['html'] = $html;
			print json_encode($jTableResult);
			exit;
		},
		'houseAccounts'=>function() {
			global $db;
			$result = $db->query("select sum(houseAccountCharge) as _total, customerName from orders where houseAccountCharge!=0 group by customerName");
			if (!$result) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$html = ''; 
			$html.= '<div style="float:left;margin:0px 300px;width:100%">';
			$html.= ' <h1>Open House Account Amounts</h1>';
			$html.="<table><thead><tr><td>Name</td><td>Amount</td></tr></thead><tbody>";
			$rows =  $result->fetch_all(MYSQLI_ASSOC);
			foreach ($rows as $row) {
				$html.="<tr><td>".$row['customerName']."</td>";
				$html.="<td style='text-align:right;'>".number_format(floatval($row['_total']),2)."</td></tr>";
			}
			$html.="</tbody></table></div>";
			$jTableResult = array();
			$jTableResult['Result']  = "OK";
			$jTableResult['html'] = $html;
			print json_encode($jTableResult);
			exit;
		},
		'getProductSales'=>function() {
			global $db;
			switch($_REQUEST['modifier']) {
				case 'today':
					$startDate=$endDate=date("ymd");
					break;
				case 'thisWeek':
					$startDate= date("ymd",strtotime('last sunday'));
					$endDate=date("ymd");
					break;
				case 'thisMonth':
					$startDate= date("ymd",strtotime('first day of this month'));
					$endDate  = date("ymd");
					break;
				case 'lastMonth':
					$startDate= date("ymd",strtotime('first day of last month'));
					$endDate  = date("ymd",strtotime('last day of last month'));
					break;
				case 'thisYear':
					$startDate= date("ymd",strtotime('first day of January '.date('Y')));
					$endDate  = date("ymd");
					break;
				default:
					$startDate=$endDate=date("ymd");
					break;
			}
			$db->query("SET sql_mode = '';");
			$query = "select shortText as `product_`,0 as `Orders`,0 as `Quantity`,0 as `Total Price` from products where ".
					 "id not in (select productID from orderitems where substring(`order`,1,6) >= $startDate ". 
					 "and substring(`order`,1,6) <= $endDate) ".
					 "union DISTINCT ".
					 "select IFNULL(`products`.`shortText`,orderitems.product) as `product_`, count(*) as Orders, sum(quantity) as Quantity, sum(quantity*orderitems.price) as `Total Price` ".
					 "from orderitems left join products on products.id = orderitems.productID ".
					 "where substring(`order`,1,6) >= $startDate and substring(`order`,1,6) <= $endDate  ".
					 "group by product_ ".
					 "order by `Total Price` DESC;"; 
			$result = $db->query($query);
			if (!$result) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			return $result->fetch_all(MYSQLI_ASSOC);
		},
		'productSales'=>function() {
			global $actions;
			$rows = $actions['getProductSales']();
			$html = '';
			$html.= '<div style="float:left;margin:0px 200px;width:100%">';
			$html.= ' <h1>Product Sales Report</h1>';
			$html.= ' <table style="width:600px">';
			$html.= '   <thead><tr>';
			$html.= '   <th style="text-align:left">Product</th>';
			$html.= '   <th style="text-align:right">Orders</th>';
			$html.= '   <th style="text-align:right">Quantity</th>';
			$html.= '   <th style="text-align:right">Total Revenue</th>';
			$html.=' 	</tr></thead><tbody>';
			foreach ($rows as $row) {
				$html.='<tr>';
				foreach ($row as $key=>$value) {
					if ($key=='product_') $align="left"; else $align="right";
					if ($key=='Total Price') $value =  number_format((float)$value, 2);
					$html.="<td style='text-align:$align'>$value</td>";
				}
				$html.='</tr>';
			}
			$html.=' </tbody></table>';
			$html.= '</div>';
			$jTableResult = array();
			$jTableResult['Result']  = "OK";
			$jTableResult['html'] = $html;
			print json_encode($jTableResult);
			exit;
		},
		'getHourSales'=>function() {
			global $db;
			switch($_REQUEST['modifier']) {
				case 'today':
					$startDate=$endDate=date("ymd");
					break;
				case 'thisWeek':
					$startDate= date("ymd",strtotime('last sunday'));
					$endDate=date("ymd");
					break;
				case 'thisMonth':
					$startDate= date("ymd",strtotime('first day of this month'));
					$endDate  = date("ymd");
					break;
				case 'lastMonth':
					$startDate= date("ymd",strtotime('first day of last month'));
					$endDate  = date("ymd",strtotime('last day of last month'));
					break;
				case 'thisYear':
					$startDate= date("ymd",strtotime('first day of January '.date('Y')));
					$endDate  = date("ymd");
					break;
				default:
					$startDate=$endDate=date("ymd");
					break;
			}
			$query = 
					 "SELECT date_format(orderDate,'%H') as Hour, COUNT(*) as Orders, sum(ROUND(total,2)) FROM orders ".
					 "where substring(`id`,1,6) >= $startDate and substring(`id`,1,6) <= $endDate  ".
					 "GROUP BY Hour ORDER BY Hour;";
posLog($query);					 
			$result = $db->query($query);
			if (!$result) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			return $result->fetch_all(MYSQLI_ASSOC);
		},
		'hourSales'=>function() {
			global $actions;
			$rows = $actions['getHourSales']();
			$html = '';
			$html.= '<div style="float:left;margin:0px 300px;width:100%">';
			$html.= ' <h1>Sales By Hour Report</h1>';
			$html.= ' <table style="width:400px">';
			$html.= '   <thead><tr>';
			$html.= '   <th style="text-align:right">Hour</th>';
			$html.= '   <th style="text-align:right">Orders</th>';
			$html.= '   <th style="text-align:right">Total Revenue</th>';
			$html.=' 	</tr></thead><tbody>';
			foreach ($rows as $row) {
				$html.='<tr>';
				foreach ($row as $key=>$value) {
					$html.="<td style='text-align:right'>$value</td>";
				}
				$html.='</tr>';
			}
			$html.=' </tbody></table>';
			$html.= '</div>';
			$jTableResult = array();
			$jTableResult['Result']  = "OK";
			$jTableResult['html'] = $html;
			print json_encode($jTableResult);
			exit;
		}
		
	); // end $action associate array definition

	if (isset($actions[$_REQUEST['action']])) {
		call_user_func($actions[$_REQUEST['action']],'');
	}
	else {
		posLog("Error in order table - invalid action=".$_REQUEST['action']);
		$jTableResult = array();
		$jTableResult['Result']  = "ERROR";
		$jTableResult['Message'] = "Invalid action";
		print json_encode($jTableResult);
		exit;
	}
?>