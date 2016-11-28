# POS-Terminal
A php, MySQL and Browser implementation of a Point of Sale Terminal 

This POS System is designed for small businesses that want a simple Point of Sale(POS) system.
It is licensed under the terms of the MIT License http://www.opensource.org/licenses/mit-license.php

It does not do inventory management although it can track product sales 
It does not do time keeping or track tips for employees
It does not support an integrated credit card reader although it tracks credit card sales.

It's primary purpose is to provide a simple low cost, high preformance implementation
of a touch screen point of sale terminal and keep track of cash and credit card sales. 

The implementation uses PHP, MySQL and a browser. It is designed for a 1024x768 screen but 
is automatically scaled to any screen size in the browser.  It can be used from a browser
on a tablet or smart phone however its usability is limited by screen size.

The report feature provides reports of sales by hour and sales by tracking product 
for various time periods and a summary of sales for the last 30 days.   Someone familiar 
with MySQL could easily add additional reports specific to your company needs.

It uses the following software packages: jQuery,  jQuery-ui, js-tree, jtable, 
jQuery Validation Engine and escpos for ticket printing.   

While the server can be located a separate system, it is possible to implement 
both the server and client (chrome for example) on a POS terminal.

The implementation is relatively simple:
	- Download the code from this web site.
	- Install PHP and MySQL on your server.
	- Modify connectPOS.php to connect to your database.
	- Create the POS database and associated tables using supplied script (createDB.php)
	- Start your server and enter the web address of POS folder in your browser.
	- Login to the management console using user=Admin and password=123456.
	- Enter your company name and other options from the management console
	- Enter your employees from the management console.
	- Enter the products you want to track from the management console.
	- Define the menu structure for your business from the management console
	
A sample database is provided which can be loaded using sampleDB.php script;
The sample system can be seen on http://www.pjoneil.net/POS It is refreshed 
daily so you are free to try changes you want thru the management console.
	