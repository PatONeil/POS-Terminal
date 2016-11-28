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

	ini_set('memory_limit','1024M');
	set_time_limit ( 1800 );
	require_once('connectPOS.php');
	function rrmdir($dir) { 
		foreach(glob($dir . '/*') as $file) { 
			if(is_dir($file)) rrmdir($file); else unlink($file); 
		} 
		if (is_dir($dir)) rmdir($dir); 
	}

	SQLConnect();
	$lastModified = 0;
	$lastDBBackup = '';
	$filename='';
	$errMsg = '';
	$dir = __DIR__;
	$dir = substr($dir,0,strlen($dir)-8);
	$dir = str_replace("\\","/",$dir);
    $tempDir="$dir/log/work";
	rrmdir($tempDir);
	mkdir($tempDir);
	$start  = new DateTime();
	print "<br><b>Beginning Restore</b>";
	foreach (glob("$dir/log/db*.zip") as $filename) {
		preg_match("/db_backup(?P<date>([^\.]*))\.zip/",$filename,$matches);
		if (!isset($matches['date'])) {
			print "<br>Invalid file $filename";
			continue;
		}
		$fileDate = $matches['date'];
		echo "<br>&nbsp;-&nbsp;-&nbsp;-&nbsp;-&nbsp;- Processing $filename date=$fileDate";
		if ($fileDate>$lastModified) {
			$lastDBBackup = $filename;
			$lastModified = $fileDate;
			print "<br>&nbsp;-&nbsp;-&nbsp;-&nbsp;-&nbsp;--&nbsp; Found newer file - $filename;";
		}
	}
	if (!$lastDBBackup) $lastDBBackup = $filename;
	if (!$lastDBBackup) {
		print "No backup file available to restore!!!";
		exit;
	}
	print "<br>Opening archive file $lastDBBackup";
	$zip = new ZipArchive;
	if ($zip->open($lastDBBackup) === TRUE) {
		$zip->extractTo($tempDir);
		$zip->close();
	} else {
		print '<br>Failed to open archive';
		exit;
	}
	foreach (glob($tempDir . '/*') as $filename) {
		print "<br>Processing $filename";
		if(is_dir($filename)) continue;
		$file = fopen($filename, "r");
		$table =  basename($filename, ".sql");;
		$first  = new DateTime();
		print "<br> - - Restoring $table";
		if (!$file) {
			print "Unable to open file ($filename)!";
			posError("Unable to open file ($filename)!");
			exit;
		}
		while(! feof($file)) {
			$query = fgets($file);
			if (!$query) continue;
			//print "<br>$query";
			if (!$db->query($query)){
				print "Error on query=$query";
			}
		}
		fclose($file);
		$second = new DateTime();
		$diff = $first->diff( $second );
		print "<br> - - Finished $table in ".$diff->format( '%I:%S' );

	}
	rrmdir($tempDir);
	$second = new DateTime();
	$diff = $start->diff( $second );
	print "<br><b>Finished Restore in ".$diff->format( '%I:%S' )."</b>";
?>