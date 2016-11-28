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

	$messageActions = array (
		'load'=>function() {
			global $db;
			$query = "SELECT * FROM messages";
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
			$jTableResult['Messages'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'delete'=>function() {
			global $db;
			$query="delete from messages where id = '".$_REQUEST['id']."';";
			if (!$db->query($query)) {
				posLog("Error in Message Table  on delete\n$query");
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
		'create'=>function() {
			global $db;
			$start=date("Y-m-d H:i:s",strtotime($_REQUEST['startTime']));
			$end  =date("Y-m-d H:i:s",strtotime($_REQUEST['endTime']));
			$query = "insert into messages (startTime,endTime,message) values('$start','$end','".addslashes($_REQUEST['message'])."');";
			if (!$db->query($query)) {
				posLog("Error in Message Table  on delete\n$query");
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
		'send'=>function() {
			print <<<EOT
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"> 
	<title>O'Neil's Sandwich and Coffee Bar Administration</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, height=device-height">
	<link href="../css/jquery-ui.css" rel="stylesheet" type="text/css" />
	<link href="../css/validationEngine.jquery.css" rel="stylesheet" type="text/css" />
	<link href="../css/jquery-ui-timepicker-addon.css" rel="stylesheet">
	<script src="../js/jquery.js" type="text/javascript"></script>
	<script src="../js/jquery-ui.min.js" type="text/javascript"></script>
	<script src="../js/jquery-ui-timepicker-addon.js" type="text/javascript"></script>
</head>
<body>
	<h1>Enter Message To Send To Terminal</h1>
	<hr>

	<form action="messageManager.php"  onsubmit="return validateForm()">
	  Start Time to Begin Display of Message:
	  <br>
	  <input type="hidden" id="action" name="action" value="create">
	  <input type="text" id="startTime" name="startTime" value="">
	  <br>
	  <br>
	  End Time to End Display of Message:
	  <br>
	  <input type="text" id="endTime" name="endTime" value="">
	  <br>
	  <br>
	  Message:
	  <br>
	  <input type="text" id="message" name="message" value="">
	  <br>
	  <br>
	  <input type="submit" value="Submit">
	</form>
	<script>
		$('#startTime').datetimepicker({
			controlType: 'select',
			showButtonPanel:true,
			stepMinute: 5,
			hourMin: 6,
			hourMax: 20,
			oneLine: true,
			timeFormat: 'hh:mm tt',
		});
		$('#endTime').datetimepicker({
			controlType: 'select',
			showButtonPanel:true,
			stepMinute: 5,
			hourMin: 6,
			hourMax: 20,
			oneLine: true,
			timeFormat: 'hh:mm tt',
		});
		function validateForm() {
			if (!$('#startTime').val()) {
				alert("Start time must be provided");
				return false;
			}	
			if (!$('#endTime').val()) {
				alert("End time must be provided");
				return false;
			}	
			if (!$('#message').val()) {
				alert("Message must be provided");
				return false;
			}	
			return true;
		}	
	</script
</body>
</html>
			
EOT;
		}	// end send;
	);
	if (isset($messageActions[$_REQUEST['action']])) {
		call_user_func($messageActions[$_REQUEST['action']],'');
	}

?>