(function(){

// *****************************************************************************
// util

    function add_enter_trigger( input , button ) {
        $( input ).keyup( function( event )  {
            if ( event.keyCode === 13 ) { // Enter key
                event.preventDefault() ; // prevent default
                $( button ).trigger( "click" ) ; // trigger button click
            }
        });
    }
    

// *****************************************************************************
// variables

    var conversation_id = window.location.pathname.substr( 14 ) ; // remove '/conversation/'
    var user_id         = null ;
    var socket          = null ;

// *****************************************************************************
// page

    var page = {
        login : function() {
            // user_id
                user_id = $('#pv_user_id').val() ;
                if ( ! user_id ) return ;
            // banner update
                $('#pv_user_id_banner').html( user_id ) ;
            // socket
                socket = io( '' , { query : 'conversation_id=' + conversation_id + '&user_id=' + user_id } ) ;
                socket.on( 'message' , page.msg_receive ) ;
            // modal close and message focus
                $('#modal_login').modal( 'hide' ) ;
                $('#pv_message').focus() ;
        } ,
        msg_receive : function( message ) {
            // download
                var attachement = ( message.download ) ? '<br><a class="btn btn-primary" href="' + message.download + '"><i class="fas fa-download"></i></a>' : '' ;
            // user
            if ( message.user_id == user_id ) {
                var d = $( '<div class="outgoing_msg"><div class="sent_msg"><p>' + message.message + attachement + '</p><span class="time_date">' + message.time + '</span></div></div>' ) ;
            } else {
                var d = $( '<div class="incoming_msg"><span class="fa-stack fa-2x"><i class="fas fa-circle fa-stack-2x" style="color:#59b4d3"></i><i class="fas fa-user fa-stack-1x fa-inverse"></i></span><div class="received_msg"><div class="received_withd_msg"><p>' + message.message + attachement + '</p><span class="time_date">' + message.user_id + ' | ' + message.time + '</span></div></div></div>' ) ;
            }
            $( '#pv_msg_history' ).append( d ) ;
            $( "html, body" ).animate( { scrollTop : $( document ).height() }, 300 ) ;
        } ,
        send : function() {
            var message = $('#pv_message').val() ;
            if ( ! message ) return ;
            $('#pv_message').val( '' ) ;
            // console.log( message ) ;
            socket.emit( 'message' , message ) ;
        } ,
        init : function() {
            // events
                $('#pv_enter_button').click( page.login ) ;
                $('#pv_send_button').click( page.send ) ;
                add_enter_trigger( '#pv_user_id' , '#pv_enter_button' ) ; // shorcut on enter key
                add_enter_trigger( '#pv_message' , '#pv_send_button' ) ; // shorcut on enter key
            // banner
                $('#pv_conversation_id').html( conversation_id ) ;
            // modal login user id
                $('#modal_login').modal( 'show' ) ;
                $('#modal_login').on('shown.bs.modal', function (e) {
                    $('#pv_user_id').focus() ;
                })
        }
    } ;

    

    page.init() ;

})()