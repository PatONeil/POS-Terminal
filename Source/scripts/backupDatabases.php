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

require_once('connectPOS.php');
ini_set("memory_limit","2024M");
	function archivebackup($archiveFile, $identifier, $data, &$errMsg) {
		$ziph = new ZipArchive();
		if(file_exists($archiveFile)) {
		  if($ziph->open($archiveFile, ZIPARCHIVE::CHECKCONS) !== TRUE) {
			$errMsg = "Unable to Open $archiveFile";
			return 1;
		  }
		}
		else {
		  if($ziph->open($archiveFile, ZIPARCHIVE::CREATE) !== TRUE) {
			$errMsg = "Could not Create $archiveFile";
			return 1;
		  }
		}
		//if(!$ziph->addFile($data)) {
		if(!$ziph->addFromString($identifier, $data)) {
		  $errMsg = "error archiving $file in $archiveFile";
		  return 2;
		}
		$ziph->close();
		
		return 0;
	}
	function backupTable($tablename) {
		global $db;
		$s = "DROP TABLE IF EXISTS $tablename;\n";
		$result = $db->query("SHOW CREATE TABLE $tablename;");
		$c = $result->fetch_assoc()['Create Table'] . ";";
		$s.= str_replace(array("\r","\n"),"",$c)."\n";
		$result = $db->query("SELECT * from $tablename;");
		while ($row = $result->fetch_assoc()) {
			$keys=[];
			$values=[];
			$s.= "INSERT INTO $tablename (";
			foreach ($row as $key=>$value) {
				$keys[]="`$key`";
				if (!isset($value)) $values[]="null";
				else if (is_numeric($value)) $values[]=$value;
				else $values[]="'".addslashes($value)."'";
			}
			$s.=implode(',',$keys);
			$s.=") VALUES(";
			$s.=implode(',',$values);
			$s.=");\n";
		}
		return $s;	
	}
	
	SQLConnect();
	$tables=[];
	$errMsg = '';
	$dir = __DIR__;
	$dir = substr($dir,0,strlen($dir)-8);
	$archiveFile = "$dir/log/db_backup".date("Y-m-d_G_iA").'.zip';
	$results = $db->query("SHOW TABLES");
    while($row = $results->fetch_array()){
        $tables[] = $row[0];
    }
	foreach ($tables as $table) {
		$s =backupTable($table);
		print str_replace("\n","<br>",$s);
		$rc = archivebackup($archiveFile, $table.".sql", $s, $errMsg);
		if ($rc!==0) {
			print "<br><br><b>$errMsg";
			exit;
		}
	}

?>