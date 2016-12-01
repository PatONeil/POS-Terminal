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
	function rrmdir($dir) { 
		foreach(glob($dir . '/*') as $file) { 
			if(is_dir($file)) rrmdir($file); else unlink($file); 
		} 
		if (is_dir($dir)) rmdir($dir); 
	}
	function sendToCloud($filename) {
		$host ="http://yourBackupServer/POS/scripts/archiveDB.php";
		// set post fields
		if (function_exists('curl_file_create')) { // php 5.6+
			$cFile = curl_file_create($filename);
		} 
		else { // 
			$cFile = '@' . realpath($filename);
		}
		$post = [
			'action' 		=> 'archiveDB',
			'filename' 		=> basename($filename),
			'file_contents'	=> $cFile 
		];

		$ch = curl_init($host);
		curl_setopt($ch, CURLOPT_SAFE_UPLOAD, false);
		curl_setopt($ch, CURLOPT_POST, true);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
		// receive server response ...
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

		$server_output = curl_exec ($ch);

		curl_close ($ch);
		// further processing ....
		if ($server_output == "OK") {
			unlink($filename);
		}
	}
	
	function archiveTable($filename,$tablename,$errMsg) {
		global $db;
		$myfile = fopen($filename, "w");
		if (!$myfile) {
			$errMsg("Unable to open file ($filename)!");
			return false;
		}
		fwrite($myfile, "DROP TABLE IF EXISTS $tablename;\n");
		$result = $db->query("SHOW CREATE TABLE $tablename;");
		$c = $result->fetch_assoc()['Create Table'] . ";";
		fwrite($myfile, str_replace(array("\r","\n"),"",$c)."\n");
		$result = $db->query("SELECT * from $tablename;");
		while ($row = $result->fetch_assoc()) {
			$keys=[];
			$values=[];
			fwrite($myfile, "INSERT INTO $tablename (");
			foreach ($row as $key=>$value) {
				$keys[]="`$key`";
				if (!isset($value)) $values[]="null";
				else if (is_numeric($value)) $values[]=$value;
				else $values[]="'".addslashes($value)."'";
			}
			fwrite($myfile, implode(',',$keys));
			fwrite($myfile, ") VALUES(");
			fwrite($myfile, implode(',',$values));
			fwrite($myfile, ");\n");
		}
		fclose($myfile);
		return true;	
	}

	SQLConnect();
	$tables=[];
	$errMsg = '';

	$dir = __DIR__;
	$dir = substr($dir,0,strlen($dir)-8);
	$dir = str_replace("\\","/",$dir);
    $tempDir="$dir/log/work";
	rrmdir($tempDir);
	mkdir($tempDir);
 
	$archiveFile = "$dir/log/db_backup".date("Y-m-d_G_iA").'.zip';

	$results = $db->query("SHOW TABLES");
    while($row = $results->fetch_array()){
        $tables[] = $row[0];
    }
	foreach ($tables as $table) {
		$rc = archiveTable("$tempDir/$table.sql", $table, $errMsg);
		if ($rc=false) {
			exit;
		}
	}
	$ziph = new ZipArchive();
	if($ziph->open($archiveFile, ZIPARCHIVE::CREATE) !== TRUE) {
		exit;
	}

	
    $dir = opendir ($tempDir);
    while ($file = readdir($dir))    {
		if ($file == '.' || $file == '..') continue;
		$ziph->addFile($tempDir."/".$file,$file);
	}
	$ziph->close();
	rrmdir($tempDir);
	sendToCloud($archiveFile);
?>