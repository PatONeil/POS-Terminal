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
	$fieldUseFieldList = ['id','type','name'];
	if($_REQUEST["action"] == "load") {
		$query = "SELECT * FROM till_uses order by `name`;";
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
		$query = "SELECT * FROM till_uses order by $sortColumn;";
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
		$query="Delete from till_uses where id = ".$_REQUEST['id'].";";
		if (!$db->query($query)) {
			ssLog("Error in till_uses  on delete\n$query");
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
		foreach ($fieldUseFieldList as $field) {
			if ($field=='id') continue;
			$keylist[] = "`$field`";
			$valueList[] = is_numeric($_REQUEST[$field])?$_REQUEST[$field]:"'".addslashes($_REQUEST[$field])."'";
		}
		$keylist=implode(",",$keylist);
		$valuelist = implode(",",$valueList);
		$query = "insert into till_uses ($keylist) values($valuelist);";
//		ssLog($query);
		if ($db->query($query)===false) {
			ssLog("Error in till_uses  on create\n$query");
			$jTableResult = array();
			$jTableResult['Result']  = "ERROR";
			$jTableResult['Message'] = "error in MySQL!!!\n$query";
			print json_encode($jTableResult);
			exit;
		} 
		$_REQUEST['id']=$db->insert_id;
		$query = "select * from till_uses where id=".$_REQUEST['id']."";
//print "<br> pre $query";
		$result = $db->query($query);
		if ($result===false) {
			ssLog("Error in till_uses .. select\n$query");
			$jTableResult = array();
			$jTableResult['Result']  = "ERROR";
			$jTableResult['Message'] = "error in MySQL!!!";
			print json_encode($jTableResult);
			exit;
		}
//print "<br> post $query";
		$row   =  $result->fetch_assoc(); 
//print "<br> post fetch";
		$jTableResult = array();
		$jTableResult['Result'] = "OK";
		$jTableResult['Record'] = $row;
		print json_encode($jTableResult);
		exit;
	}
	else if($_REQUEST["action"] == "update") {
		$qPart = [];
		
		foreach ($fieldUseFieldList as $field) {
			if ($field == 'id') continue;
			$p = "`$field`=";
			if (is_numeric($_REQUEST[$field])) $p.=$_REQUEST[$field]; else $p.="'".addslashes($_REQUEST[$field])."'";
			$qPart[]=$p;
		}
		$qlist=implode(',',$qPart);
		$query = "update till_uses set $qlist where id=".$_REQUEST['id'].";";
		if (!$db->query($query)) {
			ssLog("Error in till_uses  on update/n$query");
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
		ssLog("Error in till_uses - invalid action=".$_REQUEST['action']);
		$jTableResult = array();
		$jTableResult['Result']  = "ERROR";
		$jTableResult['Message'] = "Invalid action";
		print json_encode($jTableResult);
		exit;
	}
?>