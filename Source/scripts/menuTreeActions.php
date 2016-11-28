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
ini_set('memory_limit', '2048M');
set_time_limit (300);
	function formatChildren($parentID,$rows) {
		$childContainer=[];
		foreach($rows as $row) {
			if ($row['parent']!=$parentID) continue;
			$data = [];
			foreach ($row as $k=>$d) $data[$k] = $d;
			$data['children']=[];
			$data['children']=formatChildren($row['id'],$rows);
			$childContainer[]=$data;
		}
		return $childContainer;
	}

	if (!SQLConnect()) print "<br>SQLConnect Error";
	$menuTreefieldList = ['id','parent','row','col','type','text','productID','active','online','priceOverride'];
	$action = isset($_REQUEST['action'])?$_REQUEST['action']:"no action";
	$data = '';
	$menuTreeActions = array(
		'create'=>function() {
			global $db,$menuTreefieldList;
			//$data = json_decode($_REQUEST['data'],true);
			//if (!$data['priceOverride'] or !is_numeric($data['priceOverride'])) $_REQUEST['priceOverride']=-1;
			$query = "select * from menu where parent={$_REQUEST['parent']} and row={$_REQUEST['row']} and col={$_REQUEST['col']}";
			$result = $db->query($query);
			if ($result and $result->num_rows!=0) {
				posLog("duplicate row/col found for parent. {$result->num_rows} $query");
				print "ERROR - duplicate row/col found for parent. Item not created.";
				exit;
			}
			$keylist = [];
			$valueList = [];
			foreach ($menuTreefieldList as $field) {
				if ($field == 'productID' and is_numeric($_REQUEST[$field])==false) $_REQUEST[$field]=0;
				$keylist[] = "`$field`";
				$valueList[] = is_numeric($_REQUEST[$field])?$_REQUEST[$field]:"'".addslashes($_REQUEST[$field])."'";
			}
			$keylist=implode(",",$keylist);
			$valuelist = implode(",",$valueList);
			$query = "insert into menu ($keylist) values($valuelist);";
			if ($db->query($query)===false) {
				posLog("Error in menu on create\n$query");
				print "Error in menu on create\n$query";
				exit;
			}
			print "OK";
			exit;
		},
		'delete'=>function($id) {
			global $db,$menuTreefieldList;
			if (isset($id) and $id) $direct = true;
			else {
				$id = trim($_REQUEST['id'],'"');
				$direct = false;
			}
			$query="Delete from menu where id = '$id';";
			if (!$db->query($query)) {
				posLog("Error on menu delete \n$query");
				print "Error on menu delete \n$query";
				exit;
			}
			if ($direct) return;
			print "OK";
			exit;
		},
		'update'=>function() {
			global $db,$menuTreefieldList;
			//$data = json_decode($_REQUEST['data'],true);
			$query = "select * from menu where id!={$_REQUEST['id']} and parent={$_REQUEST['parent']} and row={$_REQUEST['row']} and col={$_REQUEST['col']}";
			$result = $db->query($query);
			if ($result and $result->num_rows!=0) {
				posLog("duplicate row/col found for parent. $query");
				print "ERROR - duplicate row/col found for parent. Item not created.";
				exit;
			}
			$qPart = [];
			
			foreach ($menuTreefieldList as $field) {
				if ($field == 'id') continue;
				if ($field == 'productID' and is_numeric($_REQUEST[$field])==false) $_REQUEST[$field]=0;
				$p = "`$field`=";
				if (is_numeric($_REQUEST[$field])) $p.=$_REQUEST[$field]; else $p.="'".addslashes($_REQUEST[$field])."'";
				$qPart[]=$p;
			}
			$qlist=implode(',',$qPart);
			$query = "update menu set $qlist where id='".$_REQUEST['id']."';";
			if (!$db->query($query)) {
				posLog("Error in menuTable  on update]n$query");
				print "error in MySQL!!!";
			}
			print "OK";
			exit;
		},
		'load'=>function() {
			global $db,$menuTreefieldList;
			$query = "select * from menu";
			$result = $db->query($query);
			if (!$result) {
				posLog("Error in query\n $query");
				print "Error in query\n $query";
				exit;
			}
			$rows   =  $result->fetch_all(MYSQLI_ASSOC); 
			$data = [];
			$top=['id'=>'top',
				 'text'=>'Menu Tree',
				 'state'=>[
					'opened'=>true,
					'selected'=>false
				 ],
				'type'=>1
				];
			$children = formatChildren('top',$rows);	
			$top['children']=$children;
			$data[]=$top;
			$_data = json_encode($data);
			if (isset($_REQUEST['file'])) {
				file_put_contents("../js/menuData.js",$_data);
				print "OK";
				exit;       
			}
			print $_data;
			exit;
		},
		'fileLoad'=>function() {
			print file_get_contents("../js/menuData.js");
			exit;       
		},
		'clean'=>function() {  // fix errors
			global $db,$menuTreefieldList,$menuTreeActions;
			print "<br><b>Begin Clean</b>";
			$query = "select * from menu";
			$result = $db->query($query);
			if (!$result) {
				posLog("Error in query\n $query");
				print "Error in query\n $query";
				exit;
			}
			$rows   =  $result->fetch_all(MYSQLI_ASSOC); 
			foreach ($rows as $row) {
				if ($row['text']=='') {
					print "<br> Invalid menu item found:<br>";
					print_r($row);
					print "<br> Invalid menu item deleted:<br>";
					$menuTreeActions['delete']($row['id']);
				}
				$parent = $row['id'];
				foreach ($rows as $p) {
					if ($p['parent']!=$parent) continue;
					$text = $p['text'];
					foreach ($rows as $c) {
						if ($parent == $c['parent'] and 
						    $p['id']!=$c['id'] and 
							!isset($c['duplicate']) and
							$text == $c['text']) {
								// we found duplicate
								print "<br> duplicate found: parent={$row['text']}($parent), ".
								      "child1 = $text({p['id']}), ".
									  "child2 = {$c['text']}({$c['id']})";
								$c['duplicate'] = true;	
								$menuTreeActions['delete']($c['id']);
						}	
					}
				}
			}
			print "<br><b>End Clean</b>";
		}
	);	

	if (isset($_REQUEST['action']) and isset($menuTreeActions[$_REQUEST['action']])) {
		call_user_func($menuTreeActions[$_REQUEST['action']],'');
	}
?>