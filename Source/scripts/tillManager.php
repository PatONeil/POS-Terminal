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
	if (!SQLConnect()) print "<br>SQLConnect Error";
	$tillActions = array (
		'autoOpenTill'=>function() {
			global $db,$optionsActions;
			$till = $_REQUEST['till']; 
			$daily  = isset($_REQUEST['dailyClose'])?' via Daily Close':'';
			$openTill = call_user_func($optionsActions['getValue'],"autoOpenTill{$till}");
			posLog("autoOpenTill Request for till=$till and openTill=$openTill");			
			if (!$openTill) {
				$query = "SELECT * FROM tills where tillName = 'till$till' " .
						 "and (entryType='tillOpen' or entryType='tillClose') ".
						 "order by id desc limit 1;";
				$result = $db->query($query);
				if ($result->num_rows) {
					$row = $result->fetch_assoc();
					if ($row['entryType']=='tillOpen') {
						$jTableResult = array();
						$jTableResult['Result'] = "OK";
						print json_encode($jTableResult);
						exit;
					}	
				}
				$jTableResult = array();
				$jTableResult['Result'] = "NOK";
				$jTableResult['Message'] = "Till$till not open.";
				print json_encode($jTableResult);
				exit;
			}
			
			$alreadyOpen = false;
			$yesterday = date("Y-m-d",strtotime('-1 day'));
			$today     = date("Y-m-d");
			// do we need to open? No, if last entry of previous day or open entry for this day;
			$query = "SELECT * FROM tills where tillName = 'till$till' " .
					 "and (entryType = 'tillOpen' or entryType = 'tillClose') ".
					 "and (DATE(date) = '$yesterday' or DATE(date) = '$today') ".
					 "order by id desc limit 1;";
			$result = $db->query($query);
			if ($result->num_rows) {
				$row = $result->fetch_assoc();
				if ($row['entryType']=='tillOpen') $alreadyOpen=true;
			}
			
			if (!$alreadyOpen) {
				$today = date("Y-m-d");
				$query = "SELECT * FROM tills where tillName = 'till$till' " .
						 "and (entryType='tillOpen' or entryType='tillClose') ".
						 "and DATE(date) = '$today' ".
						 "order by id desc limit 1;";
				$result = $db->query($query);
				if ($result and $result->num_rows) {
					$row = $result->fetch_assoc();
					if ($row['entryType']=='tillOpen') $alreadyOpen=true;
				}
			}
			if ($alreadyOpen) {
				$jTableResult = array();
				$jTableResult['Result'] = "OK";
				print json_encode($jTableResult);
				exit;
			}
			$openTillAmt = call_user_func($optionsActions['getValue'],"autoOpenTill{$till}Amt");
			$date = "Auto open on ".date('m-d H:i').$daily;  
			$query = "INSERT INTO `tills` (`tillName`,`entryType`,`reference`,`amount`,`employeeID`) VALUES ('till$till','tillOpen','$date',$openTillAmt,-1);";
			$result = $db->query($query);
			if ($result!==true) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			posLog("Till$till automatically opened with $openTillAmt.");
			$jTableResult = array();
			$jTableResult['Message'] = "Till$till automatically opened with $openTillAmt.";
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'openTill'=>function() {
			global $db;
			$till = $_REQUEST['till'];
posLog("openTill Mgr till=$till");			
			$amount = $_REQUEST['amount'];
			$employeeID=$_REQUEST['employeeID'];
			$query = "SELECT * FROM tills where tillName = '$till' " .
					 "and (entryType='tillOpen' or entryType = 'tillClose') ".
					 "order by id desc limit 1;";
					 
			$result = $db->query($query);
			if ($result===false) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			if ($result->num_rows == 0 or ($result->fetch_assoc()['entryType']) == 'tillClose') {
				$date = "Open on ".date('m-d H:i');  
				$query = "INSERT INTO `tills` (`tillName`,`entryType`,`reference`,`amount`,`employeeID`) VALUES ('$till','tillOpen','$date',$amount,$employeeID);";
				$result = $db->query($query);
				if ($result!==true) {
					posLog("Error in query\n $query");
					$jTableResult = array();
					$jTableResult['Result']  = "ERROR";
					$jTableResult['Message'] = "error in MySQL!!!";
					print json_encode($jTableResult);
					exit;
				}
				$jTableResult = array();
				$jTableResult['Result'] = "OK";
				print json_encode($jTableResult);
				exit;
			}
			else {
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "Till already open, must be closed before re-opening.";
				print json_encode($jTableResult);
				exit;
			}
		},
		'priorClose' =>function() {
			global $db;
			$date = date('Y-m-d');
			$jTableResult = array();
			$query = "Select * from tills where DATE(date)='$date' and reference like 'Daily Close%';";
			$result = $db->query($query);
			if ($result and  $result->num_rows!=0) {
				$jTableResult['Result']  = "true";
				print json_encode($jTableResult);
				exit;
			}
			$jTableResult['Result']  = "false";
			print json_encode($jTableResult);
			exit;
		},
		
		'voidPriorClose'=>function() {
			global $db;
			$date = date('Y-m-d');
			$jTableResult = array();
			$query = "Delete from tills where DATE(date)='$date' and reference like '%Daily Close%';";
			$result = $db->query($query);
			$jTableResult['Result']  = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'closeTill'=>function() {
			global $db;
			$till = $_REQUEST['till'];
			$amount = $_REQUEST['amount'];
			$daily  = isset($_REQUEST['dailyClose'])?'Daily ':'';
			posLog("{$daily}Close till=$till with $amount in till");			

			$employeeID=$_REQUEST['employeeID'];
			$query = "SELECT * FROM tills where tillName = '$till' " .
					 "and (entryType='tillOpen' or entryType = 'tillClose') ".
					 "order by id desc limit 1;";
			$result = $db->query($query);
			if ($result===false) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			if ($result->num_rows == 0 or ($result->fetch_assoc()['entryType']) == 'tillOpen') {
				$date = "{$daily}Closed on ".date('m-d H:i');  
				$query = "INSERT INTO `tills` (`tillName`,`entryType`,`reference`,`amount`,`employeeID`) VALUES ('$till','tillClose','$date',$amount,$employeeID);";
				$result = $db->query($query);
				if ($result!==true) {
					posLog("Error in query\n $query");
					$jTableResult = array();
					$jTableResult['Result']  = "ERROR";
					$jTableResult['Message'] = "error in MySQL!!!";
					print json_encode($jTableResult);
					exit;
				}
				$jTableResult = array();
				$jTableResult['Result'] = "OK";
				print json_encode($jTableResult);
				exit;
			}
			else {
posLog("Till= $till already closed, must be opened before re-closing.");				
				$jTableResult = array();
				$jTableResult['Result']  = "OK";
				$jTableResult['Message'] = ""; //"Till already closed, must be opened before re-closing.";
				print json_encode($jTableResult);
				exit;
			}
		},
		'tillOrder'=>function() {
			global $db;
			$query="";
			$list = array("cash","check","gift");
			foreach ($list as $type) {
				if ($_REQUEST[$type]) {
					if ($_REQUEST['num']=="House Account Payment") $entryType ="house-$type";
					else $entryType = "order-$type";
					$query = "INSERT INTO `tills` (`tillName`,`entryType`,`reference`,`amount`,`employeeID`)".
					"VALUES ('{$_REQUEST['till']}','order-$type','{$_REQUEST['num']}',{$_REQUEST[$type]},{$_REQUEST['employeeID']});";
					$result = $db->query($query);
					if ($result!==true) {
						posLog("Error in query\n $query");
						$jTableResult = array();
						$jTableResult['Result']  = "ERROR";
						$jTableResult['Message'] = "error in MySQL!!!";
						print json_encode($jTableResult);
						exit;
					}
				}
			}
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'tillOps'=>function() {
			global $db;
			$query="";
			$query = "INSERT INTO `tills` (`tillName`,`entryType`,`reference`,`description`,`amount`,`employeeID`)".
				"VALUES ('{$_REQUEST['till']}','{$_REQUEST['entryType']}','{$_REQUEST['reference']}',".
				"'{$_REQUEST['description']}',{$_REQUEST['amount']},{$_REQUEST['employeeID']});";
			$result = $db->query($query);
			if ($result!==true) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		},
		'settlementPreview'=>function() {
			global $db;
			$till = $_REQUEST['till'];
			$query = "select * from tills where tillName='$till' and date >= ".
					 "(select date from tills where entryType = 'tillOpen' order by date desc limit 1) ".
					 "order by entryType desc;";
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
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['Records'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'openCashDrawer'=>function() {
			global $db,$comPort;
			$query = "select * from options where `key`='till{$_REQUEST['terminalNumber']}Port';";
			$result = $db->query($query);
			if (!$result) {
				posLog("Error in query\n $query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$row = $result->fetch_assoc();
			$comPort = $row['value'];
			// because "try" does not seem to work!!!!
			$old_error_handler = set_error_handler(function($errno, $errstr, $errfile, $errline) {
				global $comPort;
				posLog("Invalid port for Cash Drawer: $comPort");
				$jTableResult = array();
				$jTableResult['Result'] = "OK";
				print json_encode($jTableResult);
				exit;
			});

			$port = fopen($comPort, "r+b");
			fputs($port, "hello");
			fclose($port);
			set_error_handler($old_error_handler);
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			print json_encode($jTableResult);
			exit;
		}
	);
	if (isset($tillActions[$_REQUEST['action']])) {
		call_user_func($tillActions[$_REQUEST['action']],'');
	}
?>