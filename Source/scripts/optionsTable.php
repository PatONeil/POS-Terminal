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
	$fieldList = ['key','option','value'];
	$optionsActions = array (
		'getValue'=>function($key) {
			global $db,$optionsActions,$fieldList;
			$direct = true;
			if (!isset($key)) {
				if (!isset($_REQUEST['key'])) {
					posLog('invalid request to optionTable->getValue');
					return;
				}
				else {
					$key = $_REQUEST['key'];
					$direct = false;
				}
			}
			$value = '';
			global $db;
			$query = "SELECT * FROM options where `key`='$key';";
			$result = $db->query($query);
			if ($result and $result->num_rows) {
				$row = $result->fetch_assoc();
				$value = $row['value'];
			}
			if ($direct) return $value;
			$jTableResult = array();
			$jTableResult['Result'] = "OK";
			$jTableResult['Value'] = $value;
			print json_encode($jTableResult);
			exit;
		},
		'load'=>function() {
			global $db;
			$query = "SELECT * FROM options;";
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
			$jTableResult['TotalRecordCount'] = count($rows);
			$jTableResult['Records'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'list'=>function() {
			global $db;
			$sortColumn="sortSequence";
			if (isset( $_REQUEST["jtSorting"])) $sortColumn = $_REQUEST["jtSorting"];
			//Get records from database
			$query = "SELECT * FROM options order by $sortColumn;";
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
			$jTableResult['TotalRecordCount'] = count($rows);
			$jTableResult['Records'] = $rows;
			print json_encode($jTableResult);
			exit;
		},
		'delete'=>function() {
			global $db;
			$query="Delete from options where `key` = '".$_REQUEST['key']."';";
			if (!$db->query($query)) {
				posLog("Error in optionsTable  on delete\n$query");
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
			global $db,$optionsActions,$fieldList;
			$keylist = [];
			$valueList = [];
			foreach ($fieldList as $field) {
				$keylist[] = "`$field`";
				$valueList[] = is_numeric($_REQUEST[$field])?$_REQUEST[$field]:"'".addslashes($_REQUEST[$field])."'";
			}
			$keylist=implode(",",$keylist);
			$valuelist = implode(",",$valueList);
			$query = "insert into options ($keylist) values($valuelist);";
			if ($db->query($query)===false) {
				posLog("Error in optionsTable  on create\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!\n$query";
				print json_encode($jTableResult);
				exit;
			}
			$query = "select * from options where `key`='".$_REQUEST['key']."'";
			$result = $db->query($query);
			if ($result===false) {
				posLog("Error in optionsTable .. select\n$query");
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
		'update'=>function() {
			global $db,$optionsActions,$fieldList;
			$qPart = [];
			foreach ($fieldList as $field) {
				if ($field == 'key') continue;
				if (!isset($_REQUEST[$field])) continue;
				$p = "`$field`=";
				if (is_numeric($_REQUEST[$field])) $p.=$_REQUEST[$field]; else $p.="'".addslashes($_REQUEST[$field])."'";
				$qPart[]=$p;
			}
			$qlist=implode(',',$qPart);
			$query = "update options set $qlist where `key`='".$_REQUEST['key']."';";
			if (!$db->query($query)) {
				posLog("Error in optionsTable  on update]n$query");
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
	);
	if (isset($_REQUEST['action']) and isset($optionsActions[$_REQUEST['action']])) {
		call_user_func($optionsActions[$_REQUEST['action']],'');
	}
?>