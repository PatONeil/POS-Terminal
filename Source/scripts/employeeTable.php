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
	global $employeeActions;
	if (!SQLConnect()) print "<br>SQLConnect Error";
	$employeeFieldList = ['id','name','phone','type','password','active'];
	$employeeActions = array (
		'load'=>function() {
			global $db,$employeeFieldList;
			$query = "SELECT * FROM employees where active = 1 order by `name`;";
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
			foreach ($rows as &$row) $row['password']=sha1($row['password']);
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['TotalRecordCount'] = count($rows);
			$jTableResult['Records'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'list'=>function() {
			global $db,$employeeFieldList;
			$sortColumn="name";
			if (isset( $_REQUEST["jtSorting"])) $sortColumn = $_REQUEST["jtSorting"];
			$query = "SELECT * FROM employees order by $sortColumn;";
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
		'delete'=>function() {
			global $db,$employeeFieldList;
			$query="delete from employees where ID = '".$_REQUEST['id']."';";
			if (!$db->query($query)) {
				ssLog("Error in employeeTable  on delete\n$query");
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
			global $db,$employeeFieldList;
			$keylist = [];
			$valueList = [];
			foreach ($employeeFieldList as $field) {
				if ($field=='id') continue;
				$keylist[] = "`$field`";
				$valueList[] = is_numeric($_REQUEST[$field])?$_REQUEST[$field]:"'".addslashes($_REQUEST[$field])."'";
			}
			$keylist=implode(",",$keylist);
			$valuelist = implode(",",$valueList);
			$query = "insert into employees ($keylist) values($valuelist);";
			if ($db->query($query)===false) {
				ssLog("Error in employeeTable  on create\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!\n$query";
				print json_encode($jTableResult);
				exit;
			}
			$query = "select * from employees where ID='".$db->insert_id."'";
			$result = $db->query($query);
			if ($result===false) {
				ssLog("Error in employeeTable .. select\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$row   =  $result->fetch_assoc(); 
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['Record'] = $row;
			print json_encode($jTableResult);
			exit;
		},
		'update'=>function(){
			global $db,$employeeFieldList;
			$qPart = [];
			foreach ($employeeFieldList as $field) {
				if ($field == 'id') continue;
				$p = "`$field`=";
				if (is_numeric($_REQUEST[$field])) $p.=$_REQUEST[$field]; else $p.="'".addslashes($_REQUEST[$field])."'";
				$qPart[]=$p;
			}
			$qlist=implode(',',$qPart);
			$query = "update employees set $qlist where ID='".$_REQUEST['id']."';";
			if (!$db->query($query)) {
				ssLog("Error in employeeTable  on update]n$query");
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
		'getEmployee'=>function($returnArray=false) {
			global $db,$employeeFieldList;
			$query = "select * from employees where ID='".$_REQUEST['id']."'";
			$result = $db->query($query);
			if ($result===false) {
				ssLog("Error in employeeTable .. select\n$query");
				if ($returnArray) return array();
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!";
				print json_encode($jTableResult);
				exit;
			}
			$row   =  $result->fetch_assoc(); 
			if ($returnArray) return $row;
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['Record'] = $row;
			print json_encode($jTableResult);
			exit;
		}
	); // end $action associate array definition

	if (isset($_REQUEST['action']) and isset($employeeActions[$_REQUEST['action']])) {
		call_user_func($employeeActions[$_REQUEST['action']],'');
	}
?>