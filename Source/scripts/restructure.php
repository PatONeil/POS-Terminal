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
require_once "menuTreeActions.php";
	global $menuTreeActions;
	SQLConnect();

	$dbList = <<<EOT
		ALTER TABLE `pos`.`products` 
		ADD COLUMN `id` INT NOT NULL AUTO_INCREMENT FIRST,
		DROP PRIMARY KEY,
		ADD PRIMARY KEY (`id`);


		update menu 
		right join products on products.productID = menu.productID
		set menu.productID = products.id;
		update menu set productID = '' WHERE productID REGEXP '[^0-9]';

		update orderitems 
		right join products on products.productID = orderitems.productID
		set orderitems.productID = products.id;
		update orderitems set productID = '' WHERE productID REGEXP '[^0-9]';


		ALTER TABLE `pos`.`products` 
		DROP COLUMN `productID`,
		DROP INDEX `productID_UNIQUE` ;

		ALTER TABLE `pos`.`menu` 
		CHANGE COLUMN `menuID` `id` VARCHAR(16) NOT NULL ;

		ALTER TABLE `pos`.`menu` 
		CHANGE COLUMN `caption` `text` VARCHAR(36) NULL ;

		update menu set type=1 where type='subMenu';
		update menu set type=2 where type='menuItem';
		update menu set type=3 where type='optionalSelectionMenu';
		update menu set type=4 where type='requiredSelectionMenu';
		update menu set type=5 where type='optionalSelection';
		update menu set type=6 where type='requiredSelection';
		update menu set type=7 where type='optionalAttribute';
		update menu set type=8 where type='defaultAttribute';

		ALTER TABLE `pos`.`menu` 
		CHANGE COLUMN `type` `type` VARCHAR(1) NOT NULL ;
EOT;
	$queries = explode(';',$dbList);
	foreach ($queries as $query) {
		if (!trim($query)) continue;
		print "<br>$query";
		$result = $db->query($query);
		if (!$result) {
			print "<br> - - Error on query, aborting";
			exit;
		}
	}
	print "<br><br>Now rebuilding menu";
	$_REQUEST['file'] = true;
	$menuTreeActions['load']();


?>