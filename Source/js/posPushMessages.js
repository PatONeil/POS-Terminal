/*!
 * POS Point of Sale System 
 * http://www.pjoneil.net/POS
 *
 * Copyright c 2016 Patrick J. O'Neil http://www.pjoneil.net
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */
	posTerminal.posPushMessages = {
		init: 				function() {
			var self = this;
			setInterval(function(){self.setupMessages();},10000);
		},
		destroy:			function() {
		},
		setupMessages:function() {
			if ($('#posTerminalHeader').length==0) return;  // main page not being displayed;
			this.getMessages();
			this.displayMessages();
		},
		getMessages:		function() {
			$.ajax({					// 
				dataType: "json",
				url: "scripts/messageManager.php",
				data: {action:'load'},
				success: function( results ) {
					var i,record;
					if (results.Result=="OK") {
						if (!results.Messages||results.Messages==0) posTerminal.messages=[];
						else posTerminal.messages=results.Messages;
					}
					else alert(results.Message);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					// ignore errors..
				}
			});			
		},
		displayMessages:	function() {
			var self=this,html='',i,message,date=Date.now();
			$('#posTerminal').find('#posMessages').remove();
			if (posTerminal.messages.length==0) return;
			html+='<div id="posMessages" style="position:absolute;top:5px;left:5px;width:400;z-index:2">';
			html+='		<p style="font-size:12px;margin:0px;padding:0px;text-decoration:underline;">Messages</p>';
			html+='		<table style="font-size:10px;border-collapse: collapse;">';
			
			for (i in posTerminal.messages) {
				message=posTerminal.messages[i];
				if (message.message=='restart'){
					$.get('scripts/messageManager.php?action=delete&id='+message.id);
					posTerminal.logMessage("Restart requested via server");
					setTimeout(function(){location.reload(true);},50);
					return;
				}
				if ((new Date(message.startTime))<=date && (new Date(message.endTime))>=date)
					html+=this.displayMessage(message);
			}
			html+='		</table>';
			html+='</div>';
			$('#posTerminal').find('#posMessages').remove();
			$('#posTerminal').append(html);
			$('#posMessages').find('button').on('click',self,self.discardMessage);
			
		},
		displayMessage:		function(message) {
			var html;
			html='<tr id="messageID_'+message.id+'" style="border:1px solid #f0f0f0">';
//			html+='	<td style="width:200px;">'+(new Date(message.startTime)).toLocaleString()+'</td>';
//			html+='	<td>'+(new Date(message.endTime)).toLocaleString()+'</td>';
			html+='	<td style="width:200px;">'+message.message+'</td>';
			html+='	<td><button style="padding:0px;font-size:10px;" class="messageButton">Discard</button></td>';
			html+='</tr>';
			return html;
		},
		discardMessage:		function(e) {
			var i;
			var id = $(e.target).parents('tr').attr('id');
			var messageID=id.substr(10);
			for (i=0;i<posTerminal.messages.length;i++) {
				if (posTerminal.messages[i].id==messageID) break;
			}
			if (i==posTerminal.messages.length) return;
			if (posTerminal.messages.length==1) posTerminal.messages.pop();
			else  posTerminal.messages.splice(i,1);
			posTerminal.posPushMessages.displayMessages();
			$.ajax({					// 
				dataType: "json",
				url: "scripts/messageManager.php",
				data: {action:'delete',id:messageID},
				success: function( results ) {
					var i,record;
					if (results.Result=="OK") {
					}
					else alert(results.Message);
				},
				error: function(jqXHR, textStatus, errorThrown ){
					// ignore errors..
				}
			});			
			
		}
	};
	posTerminal.posPushMessages.init();
