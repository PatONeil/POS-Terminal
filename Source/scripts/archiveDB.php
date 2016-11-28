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


	// delete any backups over 30 days old;
	$now   = time();
	foreach(glob('../../log/*') as $file) { 
		if (is_file($file)) {
			//print "<br>$file was last modified: " . date ("F d Y H:i:s.", filemtime($file));
			if ($now - filemtime($file) >= 60 * 60 * 24 * 30) { // 30 days
				//print "<br> - - - deleting $file";
				unlink($file);
			}
		}
	} 
	
	
	
	if (!$_REQUEST['action']) {
		print "Invalid use of script!";
		exit;
	}
	if ($_REQUEST['action']!="archiveDB") {
		print "Invalid use of script!!";
		exit;
	}
//	print "saving to "."../../log/" . $_REQUEST['filename'];
	if (move_uploaded_file($_FILES['file_contents']['tmp_name'], "../../log/" . $_REQUEST['filename'])) {
		print "OK";
		exit; 
	}
	print "NOK";
?>