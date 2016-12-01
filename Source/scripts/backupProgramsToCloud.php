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
	
	function addFolder($zip, $folder, $newPath) {
		$zip->addEmptyDir($newPath); 
		foreach(glob($folder . '/*') as $file) { 
			$name = basename($file);
			$file = str_replace('\\', '/', $file);
			if(is_dir($file)) {
				$zip->addEmptyDir($newPath."/".$name); 
				addFolder($zip,$file,$newPath."/".$name);
			}
			else {
				$zip->addFile($file,$newPath."/".$name); 
				
			}	
		} 
    }
	SQLConnect();
	$tables=[];
	$errMsg = '';

	$dir = __DIR__;
	$dir = substr($dir,0,strlen($dir)-8);
	$dir = str_replace("\\","/",$dir);
//    $tempDir="$dir/log/work";
//	rrmdir($tempDir);
//	mkdir($tempDir);
 
	$archiveFile = "$dir/log/program_backup".date("Y-m-d_G_iA").'.zip';
	$ziph = new ZipArchive();
	if($ziph->open($archiveFile, ZIPARCHIVE::CREATE) !== TRUE) {
		exit;
	}
	foreach(glob($dir . '/*.*') as $file) { 
		if (is_dir($file)) continue;
		$ziph->addFile($file,basename($file));
	}
	addFolder($ziph, "$dir/js","js");
	addFolder($ziph, "$dir/css","css");
	addFolder($ziph, "$dir/scripts","scripts");
	addFolder($ziph, "$dir/pages","pages");
	addFolder($ziph, "$dir/Escpos","Escpos");
	$ziph->close();
//	rrmdir($tempDir);
	sendToCloud($archiveFile);
?>