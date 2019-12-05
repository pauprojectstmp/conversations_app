(function(){

	var page_data = {
		conversations : {}
	} ;

    var page = {
		list : {
			call : function() {
				$.ajax({
					method  : 'GET' ,
					url     : 'api/conversations' ,
					success : page.list.success
				});
			} ,
			success : function( data ) { 
				page_data.conversations = JSON.parse( data ) ;
			}
		} ,
		create_conv : {
			call : function() {
				$.ajax({
					method  : 'POST' ,
					url     : 'api/conversations' ,
					success : page.create_conv.success
				});
			} ,
			success : function( data ) { 
				var o = JSON.parse( data ) ;
				document.location = '/conversation/' + o.conversation_id ;
			}
		} ,
		init : function() {
			// list template
				new Vue({
					el   : '#pv_conversations',
					data : page_data
				}) ;
				$( '#pv_conversations' ).show() ;
			// events
				$( '#pv_refresh' ).click( page.list.call ) ;
				$( '#pv_new' ).click( page.create_conv.call ) ;
			
			// init list
				page.list.call() ;
		}
	} ;

	// init
	page.init() ;

})()