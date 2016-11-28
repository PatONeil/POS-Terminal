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
	$fieldList = ['id','name','phone','type','creditCard','taxExempt'];
	if($_REQUEST["action"] == "load") {
		$query = "SELECT * FROM customers order by `name`;";
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
	}
	if($_REQUEST["action"] == "list") {
		$sortColumn="name";
		if (isset( $_REQUEST["jtSorting"])) $sortColumn = $_REQUEST["jtSorting"];
		//Get records from database
		$query = "SELECT * FROM customers order by $sortColumn;";
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
	}
	else if($_REQUEST["action"] == "delete") {
		$query="Delete from customers where ID = '".$_REQUEST['id']."';";
		if (!$db->query($query)) {
			ssLog("Error in customerTable  on delete\n$query");
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
	else if($_REQUEST["action"] == "create") {
		$keylist = [];
		$valueList = [];
		foreach ($fieldList as $field) {
			if ($field=='id') continue;
			$keylist[] = "`$field`";
			$valueList[] = is_numeric($_REQUEST[$field])?$_REQUEST[$field]:"'".addslashes($_REQUEST[$field])."'";
		}
		$keylist=implode(",",$keylist);
		$valuelist = implode(",",$valueList);
		$query = "insert into customers ($keylist) values($valuelist);";
		if ($db->query($query)===false) {
			ssLog("Error in customerTable  on create\n$query");
			$jTableResult = array();
			$jTableResult['Result']  = "ERROR";
			$jTableResult['Message'] = "error in MySQL!!!\n$query";
			print json_encode($jTableResult);
			exit;
		}
		$query = "select * from customers where id='".$db->insert_id."'";
		$result = $db->query($query);
		if ($result===false) {
			ssLog("Error in customerTable .. select\n$query");
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
	}
	else if($_REQUEST["action"] == "update") {
		$qPart = [];
		
		foreach ($fieldList as $field) {
			if ($field == 'id') continue;
			$p = "`$field`=";
			if (is_numeric($_REQUEST[$field])) $p.=$_REQUEST[$field]; else $p.="'".addslashes($_REQUEST[$field])."'";
			$qPart[]=$p;
		}
		$qlist=implode(',',$qPart);
		$query = "update customers set $qlist where ID='".$_REQUEST['id']."';";
		if (!$db->query($query)) {
			ssLog("Error in customerTable  on update]n$query");
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
			ssLog("Error in customerTable - invalid action=".$_REQUEST['action']);
			$jTableResult = array();
			$jTableResult['Result']  = "ERROR";
			$jTableResult['Message'] = "Invalid action";
			print json_encode($jTableResult);
			exit;
		}
?>