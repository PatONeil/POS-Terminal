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

$query = <<<EOT
DROP TABLE IF EXISTS orders;
CREATE TABLE `orders` (  
	`id` varchar(16) NOT NULL,  
	`terminalNumber` int(11) NOT NULL DEFAULT '1',  
	`orderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,  
	`settlementDate` datetime DEFAULT NULL,  
	`orderNumber` int(11) NOT NULL,  
	`deliveryTime` varchar(30) DEFAULT NULL,  
	`employeeID` int(11) NOT NULL,  
	`customerName` varchar(45) DEFAULT NULL,  
	`customerID` int(11) DEFAULT NULL,  
	`taxExempt` int(11) NOT NULL DEFAULT '0',  
	`orderType` varchar(15) NOT NULL,  
	`ticketNumber` varchar(6) DEFAULT NULL,  
	`status` varchar(15) NOT NULL,  
	`subtotal` float NOT NULL,  
	`orderDiscount` float NOT NULL,  
	`orderParm` float DEFAULT NULL,  
	`discountID` varchar(45) DEFAULT NULL,  
	`totalDiscount` float NOT NULL DEFAULT '0',  
	`mgrDiscountApproval` int(11) DEFAULT NULL,  
	`tax` float NOT NULL DEFAULT '0',  
	`total` float NOT NULL,  
	`cashPayment` float DEFAULT '0',  
	`checkPayment` float DEFAULT '0',  
	`creditCardPayment` float DEFAULT '0',  
	`giftCertificatePayment` float DEFAULT '0',  
	`corporateCharge` float DEFAULT '0',  
	`houseAccountCharge` float DEFAULT '0',  
	`comments` varchar(155) NOT NULL DEFAULT '',  
	PRIMARY KEY (`id`),  
	UNIQUE KEY `id_UNIQUE` (`id`)  
	) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS orderitems;
CREATE TABLE `orderitems` (  
	`id` int(11) NOT NULL AUTO_INCREMENT,  
	`order` varchar(16) NOT NULL,  
	`product` varchar(45) NOT NULL,  
	`productID` varchar(32) NOT NULL,  
	`quantity` int(11) NOT NULL DEFAULT '1',  
	`options` varchar(1024) NOT NULL,  
	`price` float NOT NULL,  
	`discount` float NOT NULL DEFAULT '0',  
	`menuTreeID` double NOT NULL,  
	PRIMARY KEY (`id`),  
	UNIQUE KEY `id_UNIQUE` (`id`),  
	KEY `order` (`order`),  
	KEY `product` (`product`)
	) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS tills;
CREATE TABLE `tills` (  
	`id` int(11) NOT NULL AUTO_INCREMENT,  
	`tillName` varchar(45) NOT NULL,  
	`date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,  
	`entryType` varchar(45) NOT NULL,  
	`reference` varchar(45) NOT NULL DEFAULT '',  
	`description` varchar(45) NOT NULL DEFAULT '',  
	`amount` float NOT NULL DEFAULT '0',  
	`employeeID` int(11) NOT NULL DEFAULT '0',  
	PRIMARY KEY (`id`),  
	UNIQUE KEY `id_UNIQUE` (`id`)
	) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS products;
CREATE TABLE `products` (  
	`productID` varchar(20) NOT NULL,  
	`category` varchar(15) NOT NULL,  
	`longText` varchar(45) NOT NULL,  
	`shortText` varchar(20) NOT NULL,  
	`type` varchar(15) NOT NULL,  
	`price` float NOT NULL,  
	`taxable` int(11) NOT NULL DEFAULT '1',  
	`prepLocation` int(11) NOT NULL,  
	PRIMARY KEY (`productID`),  
	UNIQUE KEY `productID_UNIQUE` 
	(`productID`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS customers;
CREATE TABLE `customers` (  
	`id` int(11) NOT NULL AUTO_INCREMENT,  
	`name` varchar(45) NOT NULL,  
	`phone` varchar(16) DEFAULT NULL,  `type` varchar(15) NOT NULL,  
	`creditCard` varchar(45) DEFAULT NULL,  
	`taxExempt` int(11) NOT NULL DEFAULT '0',  
	PRIMARY KEY (`id`),  
	UNIQUE KEY `ID_UNIQUE` (`id`)
	)ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

	
DROP TABLE IF EXISTS employees;
CREATE TABLE `employees` (  
	`id` int(11) NOT NULL AUTO_INCREMENT,  
	`name` varchar(45) NOT NULL,  
	`phone` varchar(12) DEFAULT NULL,  
	`type` varchar(15) NOT NULL DEFAULT 'non-manager',  
	`password` varchar(45) DEFAULT NULL,  
	`active` int(11) NOT NULL DEFAULT '1',  
	PRIMARY KEY (`id`),  
	UNIQUE KEY `id_UNIQUE` (`id`)
	) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
INSERT INTO employees (`id`,`name`,`phone`,`type`,`password`,`active`) VALUES(1,'Admin','203-555-1212','manager',123456,1);

	
DROP TABLE IF EXISTS menu;
CREATE TABLE `menu` (  
	`menuID` varchar(16) NOT NULL,  
	`parent` varchar(16) DEFAULT NULL,  
	`row` int(11) NOT NULL,  
	`col` int(11) NOT NULL,  
	`type` varchar(32) NOT NULL,  
	`caption` varchar(36) DEFAULT NULL,  
	`productID` varchar(32) DEFAULT '',  
	`active` int(11) NOT NULL DEFAULT '0',  
	`priceOverride` float NOT NULL DEFAULT '-1',  
	`online` tinyint(1) NOT NULL DEFAULT '1',  
	PRIMARY KEY (`menuID`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;

	
DROP TABLE IF EXISTS options;
CREATE TABLE `options` (  
	`key` varchar(32) NOT NULL,  
	`option` varchar(45) NOT NULL,  
	`value` varchar(45) NOT NULL,  
	`sortSequence` int(11) DEFAULT NULL,  
	PRIMARY KEY (`key`),  
	UNIQUE KEY `key_UNIQUE` (`key`),  
	UNIQUE KEY `option_UNIQUE` (`option`)
	) ENGINE=InnoDB DEFAULT CHARSET=utf8;
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('company','Company Name','Your Company Name',1);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('address','Company Address','114 Main Street',2);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('cityStateZip','City, State Zip','Bethel CT 06801',3);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('phone','Company Phone','(203) 555-5555',4);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('msg1','Print Message 1','Thanks for your order.',6);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('msg2','Print Message 2','Come back soon!!!',7);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('tax','Sales Tax Rate',0.0635,5);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('autoOpenTill1','Auto Open Till1',1,16);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('autoOpenTill1Amt','Auto Open Till1 Amount',200,17);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('autoOpenTill2','Auto Open Till2',1,16);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('autoOpenTill2Amt','Auto Open Till2 Amount',0,17);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('till1','Till 1 Name','Register 1',8);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('till1Default','Till 1 Default Amount',200,9);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('till1Port','Till 1 Port','COM7',15);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('till2','Till 2 Name','Register 2',10);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('till2Default','Till 2 Default Amount',0,11);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('tillBank','Bank Till','Cash Box',12);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('tlen1',' Ticket Printer 1 Min. Length',25,14);
INSERT INTO options (`key`,`option`,`value`,`sortSequence`) VALUES('tprtr1','Ticket Printer 1 Name','POS-80',13);

DROP TABLE IF EXISTS till_uses;
CREATE TABLE `till_uses` (  
	`id` int(11) NOT NULL AUTO_INCREMENT,  
	`type` varchar(15) DEFAULT NULL,  
	`name` varchar(45) DEFAULT NULL,  
	PRIMARY KEY (`id`),  
	UNIQUE KEY `id_UNIQUE` (`id`)
	) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(1,'vendor','Pepperrideg Farms');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(2,'vendor','Falvay Linens');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(3,'vendor','Tropicana');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(4,'vendor','Newspaper');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(5,'add','Transfer from Cash Bank');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(6,'add','Transfer from Bank');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(7,'add','Gift Certificate Sales');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(8,'drop','Transfer to Cash Bank');
INSERT INTO till_uses (`id`,`type`,`name`) VALUES(9,'drop','Cash Donation');

DRop Table if exist `messages`;
CREATE TABLE  `messages` (
 `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY ,
 `startTime` DATETIME NOT NULL ,
 `endTime` DATETIME NOT NULL ,
 `message` VARCHAR( 120 ) NOT NULL
) ENGINE = INNODB;
EOT;


$arr = explode(";",$query);
foreach ($arr as $q ){
	$q = trim($q);
 	if (!$q) continue;
	if ($db->query($q)) print "<br>".str_replace("\n","<br>",$q)."<br>";
	else 			print "<br><b>".str_replace("\n","<br>",$q)."<br>&nbsp;&nbsp;&nbsp;&nbsp;not successfull.<br>".$db->error."</b>";
}
print "<br><br>Finished";	                   

?>