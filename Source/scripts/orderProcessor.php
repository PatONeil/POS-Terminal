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
	global $orderActions;
	date_default_timezone_set( 'America/New_York' );
	if (!SQLConnect()) print "<br>SQLConnect Error";
	$orderFieldList = ['id','terminalNumber','orderDate','settlementDate','orderNumber','deliveryTime','employeeID','customerName','customerID','taxExempt',
		'orderType','ticketNumber','status','subtotal','orderDiscount','orderParm','discountID','totalDiscount','mgrDiscountApproval',
		'tax','total','cashPayment','checkPayment','creditCardPayment','giftCertificatePayment','corporateCharge','houseAccountCharge','comments'];
	
	$itemFieldList = ['order','product','productID','quantity','caption','options','price','discount','menuTreeID'];
	$orderActions = array(
		'load'=>function() {
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$query = "SELECT * FROM orders order by `longText`;";
			$result = $db->query($query);
			if (!$result) {
				ssLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$rows   =  $result->fetch_all(MYSQLI_ASSOC); 
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['TotalRecordCount'] = count($rows);
			$jTableResult['Records'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'delete'=>function($call) {
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$json = file_get_contents('php://input');
			$fields = json_decode($json,true);
			$query="Delete from orders where id = '".$fields['id']."';";
			if (!$db->query($query)) {
				ssLog("Error in order table  on delete\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$query="Delete from orderitems where `order` = '".$fields['id']."';";
			if (!$db->query($query)) {
				ssLog("Error in order table  on delete\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			if ($call) return true;
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'getOrder'=>function($getArray=false) {
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$query = "select * from `orders` where `id` = '{$_REQUEST['id']}';";
			$result = $db->query($query);
			$order = $result->fetch_assoc();
			$query = "select * from `orderitems` where `order` = '{$order['id']}';";
//ssLog($query);			
			$result = $db->query($query);
			$menuItems   =  $result->fetch_all(MYSQLI_ASSOC); 
			$order['menuItems']=array();
			foreach ($menuItems as $menuItem) {
				if ($menuItem['options']){
					$menuItem['options'] = explode('^',$menuItem['options']);
					$keys=array("treeNodeID",'product','price');
					foreach ($menuItem['options'] as &$option) {
						$l=array();
						$option = explode('~',$option);
						for ($i=0;$i<3;$i++) {
							$l[$keys[$i]] = $option[$i];
						}
						$option = $l;
					}
				}
				$order['menuItems'][]=$menuItem;
			}
			if ($getArray) return $order;
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['Record'] = $order;
			print json_encode($jTableResult);
			exit;
		},
		'getOrderNumber'=>function(){
			global $db;
			$d=date("ymd%");
			$result = $db->query("select orderNumber,orderDate from orders where id like '$d' order by orderNumber desc limit 1");
			if (!$result or $result->num_rows==0) $orderNumber = 0 ;
			else  {
				$row = $result->fetch_assoc();
ssLog("getOrderNumber orderNumber={$row['orderNumber']}, orderDate={$row['orderDate']}");				
				if (date("ymd")!=date("ymd",strtotime($row['orderDate']))) $orderNumber=0;
				else $orderNumber = $row['orderNumber'];
			}
			$newNum = intval($orderNumber)+1;
			$id = date("ymd")."-".$newNum;
			// add placeholder...
			$db->query("insert into orders (id,orderNumber,terminalNumber,status) values('$id',$newNum,'{$_REQUEST['terminalNumber']}','Cancelled');");
			// return html script
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['lastOrderNumber'] = $orderNumber;
			print json_encode($jTableResult);
			exit;
		},
		'lastOrderNumber'=>function() {
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$key = date("ymd").'-'.$_REQUEST['terminalNumber'];
			$query = "select orderNumber from orders  by orderNumber DESC LIMIT 1;";
ssError($query);			
			$result = $db->query($query);
			if (!$result or $result->num_rows==0) $orderNumber = 0 ;
			else  {
				$row = $result->fetch_assoc();
				$orderNumber = $row['orderNumber'];
			}
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['lastOrderNumber'] = $orderNumber;
			print json_encode($jTableResult);
			exit;
		},
		'viewQuery'=>function(){
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$d = date('ymd%');
			$dm7 = date('Y-m-d',strtotime('-7 days'));
			$sel = $_REQUEST['sel'];
			$where = array(
				'dayOrders'=>"where status!='Cancelled' and orders.id like '$d'  order by orderDate desc;",
				'pendingOrders'=>"where orders.id like '$d' and status='pending'  order by orderDate desc;",
				'pendingOrdersWeek'=>"where DATE(orderDate)>'$dm7' and status='pending'  order by orderDate desc;",
				'houseOrders'=>"where status='charged' and houseAccountCharge!=0  order by customerName asc, orderDate desc;",
				'corporateOrders'=>"where status='charged' and corporateCharge!=0 order by customerName asc, orderDate desc;"
			);
			$query = "select orders.id,terminalNumber,orderNumber,DATE_FORMAT(orderDate,'%m-%d-%Y %l:%i%p') as date,".
					 "cashPayment,checkPayment,creditCardPayment,giftCertificatePayment,".
					 "corporateCharge, houseAccountCharge,".
					 "employees.name as employee,orders.employeeID, customerName,customerID, status,subtotal,totalDiscount,tax,total from orders ".
					 "left join employees on employees.id = orders.employeeID ".$where[$sel];
ssLog($query);					 
			$result = $db->query($query);
			if (!$result) {
				ssLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$rows   =  $result->fetch_all(MYSQLI_ASSOC); 
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['Records'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'create'=>function() {
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$json = file_get_contents('php://input');
			$fields = json_decode($json,true);
			
			if (!isset($fields['id'])) { // may be called for "update", ie, delete,create;
				$fields['id'] = date("ymd",strtotime($fields['orderDate']))."-".$fields['orderNumber'];
				// delete placeholder order record 
				$db->query("delete from orders where id = '{$fields['id']}'");
				// setup date field in sql format
				$fields['orderDate']= date("Y-m-d H:i:s",strtotime($fields['orderDate']));  	// convert date to MySql format.
//				if ($fields['settlementDate'])
//					$fields['settlementDate']= date("Y-m-d H:i:s",strtotime($fields['settlementDate']));  	// convert date to MySql format.
			}
			if (isset($fields['settlementDate']) and $fields['settlementDate']) {
				$fields['settlementDate']= date("Y-m-d H:i:s",strtotime($fields['settlementDate']));  	// convert date to MySql format.
			}
			$keylist = [];
			$valueList = [];
			foreach ($orderFieldList as $field) {
				if (!isset($fields[$field])) continue;   // ignore missing fields;
				if ($field=='menuItems')  continue;		 // handled separately...
				if ($field=='settlementDate' and !$fields['settlementDate']) continue; // ignore field if not set to valid date
				$keylist[] = "`$field`";
				$valueList[] = is_numeric($fields[$field])?$fields[$field]:"'".addslashes($fields[$field])."'";
			}
			$keylist=implode(",",$keylist);
			$valuelist = implode(",",$valueList);
			$query = "insert into orders ($keylist) values($valuelist);";
//ssLog($query);			
			if ($db->query($query)===false) {
				ssLog("Error in order table  on create\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!\n$query";
				print json_encode($jTableResult);
				exit;
			}
			foreach ($fields['menuItems'] as $item) {
				$keylist=[];
				$valueList=[];
				$item['order'] = $fields['id'];
				//$item['menuTreeID'] = $item['menuTree']['id'];
				//$item['options'] = implode('^',$item['options']);
				foreach ($itemFieldList as $field) {
					if (!isset($item[$field])) continue;   // ignore missing fields;
					$keylist[] = "`$field`";
					$valueList[] = is_numeric($item[$field])?
						$item[$field]:
						"'".addslashes($item[$field])."'";
				}
				$keylist=implode(",",$keylist);
				$valuelist = implode(",",$valueList);
				$query = "insert into orderitems ($keylist) values($valuelist);";
//ssLog($query);			
				if ($db->query($query)===false) {
					ssLog("Error in order table  on create\n$query");
					$jTableResult = array();
					$jTableResult['Result']  = "ERROR";
					$jTableResult['Message'] = "error in MySQL!!!\n$query";
					print json_encode($jTableResult);
					exit;
				}
			}
			if (isset($_REQUEST['print']) and $_REQUEST['print']=='true') {
				$_REQUEST=array('action'=>'');
				require_once('printOrder.php');
				printOrder($fields['id']);
			}
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'updatePayment'=>function(){
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			$query = "update orders set ".
				"status='{$_REQUEST['status']}',".
				"cashPayment={$_REQUEST['cashPayment']},".
				"checkPayment={$_REQUEST['checkPayment']},".
				"creditCardPayment={$_REQUEST['creditCardPayment']},".
				"giftCertificatePayment={$_REQUEST['giftCertificatePayment']} ,".
				"settlementDate='".date("Y-m-d H:i:s")."' ".
				"where id='".$_REQUEST['id']."';";
//ssLog($query);				
			if (!$db->query($query)) {
				ssLog("Error in order table  on update]n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			if (isset($_REQUEST['print']) and $_REQUEST['print']=='true') {
				$_REQUEST=array('action'=>'');
				require_once('printOrder.php');
				printOrder($_REQUEST['id']);
			}
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'update'=>function() {
//ssLog("Order delete called for Update function");			
			global $db,$orderFieldList,$itemFieldList,$orderActions;
			call_user_func($orderActions['delete'],true);
			call_user_func($orderActions['create'],'');
		}
	); // end $action associate array definition

	if (isset($_REQUEST['action']) and isset($orderActions[$_REQUEST['action']])) {
		call_user_func($orderActions[$_REQUEST['action']],'');
	}
?>