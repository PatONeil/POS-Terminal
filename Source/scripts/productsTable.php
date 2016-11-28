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
	global $productActions;
	if (!SQLConnect()) print "<br>SQLConnect Error";
	$productFieldList = ['id','category','longText','shortText','type','price','taxable','prepLocation'];
	$productActions = array(
		"getProduct"=>function($id) {
			global $db,$productActions,$productFieldList;
			$direct = true;
			if (!isset($id)) {
				$id=$_REQUEST['id'];
				$direct = false;
			}
			$query = "select * from products where id='".addslashes($id)."'";
			$result = $db->query($query);
			$p = array();
			if ($result and $result->num_rows!=0) $p = $result->fetch_assoc();
			if ($direct) return $p;
			$jTableResult = array();
			$jTableResult['Result']  = "OK";
			$jTableResult['Record'] = $p;
			print json_encode($jTableResult);
			exit;
		},
		"load"=>function() {
			global $db,$productActions,$productFieldList;
			$query = "SELECT * FROM products order by `longText`;";
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
		"list"=>function() {
			global $db,$productActions,$productFieldList;
			$sortColumn="`category`";
			if (isset( $_REQUEST["jtSorting"])) {
				$s = explode (' ',$_REQUEST["jtSorting"]);
				$sortColumn = " `{$s[0]}` {$s[1]} ";
			}
			//Get records from database
			$query = "SELECT * FROM products order by $sortColumn;";
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
		"delete"=>function() {
			global $db,$productActions,$productFieldList;
			$query="Delete from products where id = '".addslashes($_REQUEST['id'])."';";
			if (!$db->query($query)) {
				posLog("Error in productsTable  on delete\n$query");
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
		"create"=>function() {
			global $db,$productActions,$productFieldList;
			$keylist = [];
			$valueList = [];
			foreach ($productFieldList as $field) {
				if ($field=='id') continue;
				$keylist[] = "`$field`";
				$valueList[] = is_numeric($_REQUEST[$field])?$_REQUEST[$field]:"'".addslashes($_REQUEST[$field])."'";
			}
			$keylist=implode(",",$keylist);
			$valuelist = implode(",",$valueList);
			$query = "insert into products ($keylist) values($valuelist);";
	//		posLog($query);
			if ($db->query($query)===false) {
				posLog("Error in productsTable  on create\n$query");
				$jTableResult = array();
				$jTableResult['Result']  = "ERROR";
				$jTableResult['Message'] = "error in MySQL!!!\n$query";
				print json_encode($jTableResult);
				exit;
			}
			$query = "select * from products where id='".addslashes($_REQUEST['id'])."'";
			$result = $db->query($query);
			if ($result===false) {
				posLog("Error in productsTable .. select\n$query");
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
		"update"=>function() {
			global $db,$productActions,$productFieldList;
			$qPart = [];
			
			foreach ($productFieldList as $field) {
				if ($field == 'id') continue;
				$p = "`$field`=";
				if (is_numeric($_REQUEST[$field])) $p.=$_REQUEST[$field]; else $p.="'".addslashes($_REQUEST[$field])."'";
				$qPart[]=$p;
			}
			$qlist=implode(',',$qPart);
			$query = "update products set $qlist where id='".addslashes($_REQUEST['id'])."';";
			if (!$db->query($query)) {
				posLog("Error in productsTable  on update]n$query");
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
	if (isset($_REQUEST['action']) and isset($productActions[$_REQUEST['action']])) {
		call_user_func($productActions[$_REQUEST['action']],'');
	}
?>