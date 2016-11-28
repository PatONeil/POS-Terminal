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
	$path     = "localhost";
	$username = "";
	$password = "";
	$databaseName="";
	error_reporting(E_ALL);
	global $db;
	ini_set("date.timezone", "America/New_York");
	function SQLConnect() {
		global $db,$db_err,$db_connected;
		if ($db_connected) return true;
		$db = new mysqli($path, $username, $password, $databaseName);
		if (!$db or $db->connect_errno) {
			$db_err = "Failed to connect to MySQL: (" . $db->connect_errno . ") " . $db->connect_error;
			ssLog($db_err,"SSBadLogin.txt");
			return false;
		}
		$db_connected=true;	
		$db->autocommit(true);  // insure that unless requested, each query stands alone...
		return true;
	}	
/*-----------------------------------------------------------------------------------------------------------
	A couple of useful functions that will almost always be loaded, since SQLConnect
	are always needed
------------------------------------------------------------------------------------------------------------*/  
	$hDir = "../log";
	error_reporting(E_ALL);
	ini_set('error_log',"$hDir/PHP_Errors.txt");  // insure all including cron jobs are logged to same place
	function myErrorHandler($errno, $errstr, $errfile, $errline) {
		global $hDir;
		error_reporting(0);    		// turn off error reporting 
		set_error_handler(NULL); 	// turn off this error handler to avoid recursive entry.
		$backtrace=stackTrace();
		ssLog("Error in server side code:  $errstr in $errfile($errline)\n$backtrace","SS_PHP_Errors.txt",true);

		print "<script>alert('Error in server side code, please report.')</script>";

		die();
	}

	$old_error_handler = set_error_handler("myErrorHandler");
	
	function ssLog($msg,$logfile="MessageLog.txt",$force=false) {
		global $hDir,$FranchiseID,$debugArray;
		if ($force==false and isset($debugArray[$logfile])==false) return; // no entry in debugArray so $force is sole determinate
		if (isset($debugArray[$logfile]) and $debugArray[$logfile]==false and $force==false) return; // $debug array does not override $force
		if (!isset($FranchiseID)) $Franchise=''; else $Franchise=$FranchiseID;
		$msg = date("Y-m-d H:i:s")."($Franchise) $msg\r\n";
		file_put_contents("$hDir/$logfile", $msg, FILE_APPEND );
	} 
	  
	function ssError($error,$logfile="MessageLog.txt") { 
		ssLog("Error reported by PHP Script\r\n$error\r\n".stackTrace(false),$logfile,true);
	}	
	
	function jsonQuery($query) {
		global $db;
		$result=$db->query($query);
		if ($result===false) {
			//Return error message
			$jTableResult = array();
			$jTableResult['Result'] = "ERROR";
			$jTableResult['Message'] = "Database error.\n".$db->error."\n$query";
			print json_encode($jTableResult);
		}
		return $result;
	}

	function stackTrace($skipFirst=true) {
		try {
			$stack = debug_backtrace();
		} catch(Exception $e) { 
			return "Stack trace not available";
		}
		$output = '';
		$stackLen = count($stack);
		for ($i = ($skipFirst?2:1); $i < $stackLen; $i++) {
			$entry = $stack[$i];
			$func = $entry['function'] . '(';
			if (is_array($entry['args'])) $argsLen = count($entry['args']);
			else {
				$argsLen = 0;
			}
			$arrays=array();
			for ($j =0 ; $j < $argsLen; $j++) {
				if (is_object($entry['args'][$j])) {
					$func.="object$j";
					 $arrays['object'.$j]=get_object_vars($entry['args'][$j]);
				}
				else if (is_array($entry['args'][$j])) {
					 $func.="array$j";
					 $arrays['array'.$j]=$entry['args'][$j];
				}
				else $func .= str_replace(array("\n","\r"),'',$entry['args'][$j]);
				if ($j < $argsLen - 1) $func .= ', ';
			}
			$func .= ')';
			if (isset($entry['file'],$entry['line'],$func))
				$output .= $entry['file'] . ':' . $entry['line'] . ' - ' . $func . PHP_EOL;
			foreach ($arrays as $k=>$a) {
				$output.=" \t$k=(";
				if (is_array($a)) foreach ($a as $kk=>$aa) {
					if (is_string($aa))$output.="$kk=>$aa,";
					else $output.="$kk=>object/array";
				}
				else if (is_string($a)) $output.="$k=>$a";
				else $output.="$k=>object";
				$output=rtrim($output, ",");
				$output.=')'.PHP_EOL;
			}
		}
		$output .= "REQUEST=".str_replace(array("\n","\r"),"",var_export($_REQUEST,true));
		return $output;
	}

?>