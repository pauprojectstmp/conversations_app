// *****************************************************************************
// Constants

    const express   = require( 'express' ) ;
    const app       = express() ;
    const http      = require( 'http' ).Server( app ) ;
    const io        = require( 'socket.io' )( http ) ;
    const shortid   = require( 'shortid' )
    const fs        = require( 'fs' )
    const csvWriter = require( 'csv-write-stream' )
    const debug     = require( 'debug' )( 'peevee' ) // debug of this application

// *****************************************************************************
// objects

    const data = {
        conversations : {} ,
        msg_writers : {} ,
    } ;

// *****************************************************************************
// rest api for ajax calls

    const api = {
        conversations : {
            list : function( req , res ) {
                res.send( JSON.stringify( data.conversations ) ) ;
            } ,
            create : function( req , res ) {
                // conversation_id
                    const conversation_id = shortid.generate() ; // generation id
                // conversation object
                    const o = { 
                        'conversation_id' : conversation_id ,
                        'creation_date'   : new Date() ,
                        'message_nb'      : 0
                    }
                // messages csv writer
                    const csv_writer = csvWriter() ;
                    csv_writer.pipe( fs.createWriteStream( __dirname + '/conversations/' + conversation_id + '.csv' ) )                    
                // data
                    data.conversations[ conversation_id ] = o
                    data.msg_writers[ conversation_id ] = csv_writer
                // return
                    res.send( JSON.stringify( o ) )
            }
        }
    } ;

// *****************************************************************************
// pages

    // page dashboard
        const dashboard = {
            get_render : function( req , res ) {
                res.sendFile( __dirname + '/views/dashboard.html' ) ;
            }
        }

    // page conversation
        const conversation = {
            get_render : function( req , res ) {
                const conversation_id = req.path.substr( 14 ) ; // remove '/conversation/'
                if ( ! data.conversations[ conversation_id ] ) {
                    res.send( "conversation " + conversation_id + " does not exist" )
                } else {
                    res.sendFile( __dirname + '/views/conversation.html' ) ;
                }
            } ,
            download : function( req , res ) {
                const filename = req.path.substr( 10 ) ; // remove '/download/'
	    		res.download( __dirname + '/conversations/' + filename )
            }
        }

// *****************************************************************************
// conversations web sockets

	io.on( 'connection' , function( socket ) {
		
		// handshake parameters
			const conversation_id = socket.handshake.query.conversation_id ;
			const user_id         = socket.handshake.query.user_id ;

		// debug
			debug( 'New connection - conversation_id : %o , user_id : %o' , conversation_id , user_id )

		// associate socket to conversation to broadcast to the specific conversation
			socket.join( conversation_id ) ; 

		// disconnect
			socket.on('disconnect', function(){
				debug( 'Disconnection - conversation_id : %o , user_id : %o' , conversation_id , user_id )
            })
            
		// message
			socket.on( 'message' , function( message ) {
                // time
                    const time = new Date().toISOString()
				// debug
					debug( 'New Message - conversation_id : %o , user_id : %o' , conversation_id , user_id )
				// base msg object
					const msg = {
						user_id : user_id ,
						time    : time ,
						message : message ,
                    }
                // save
                    data.conversations[ conversation_id ].message_nb++ // increment the messages nb
                    data.msg_writers[ conversation_id ].write( msg ) ;
				// special words rules
					if ( message.toUpperCase() == 'SUMMARY' ) {
                        // variables
                            const seq      = data.conversations[ conversation_id ].message_nb ,
                                filename = conversation_id + '_' + seq + '.csv' ,
                                target   = __dirname + '/conversations/' + filename ,
                                source   = __dirname + '/conversations/' + conversation_id + '.csv' 
                        // write file for downloads
                            fs.copyFile( source , target , (err) => { if (err) throw err } )
                        // message property
                            msg.download = '/download/' + filename ;
                        // debug
                            debug( 'Message - Special word detected : %o' , 'summary' )
					}
				// broadcast to the conversation sockets
					io.to( conversation_id ).emit( 'message' , msg ) ;
			})    
	})


// *****************************************************************************
// expose web app

    // static assets
        app.use( express.static( __dirname + '/static' ) ) ;
    // api routes
        app.post('/api/conversations' , api.conversations.create )
        app.get( '/api/conversations' , api.conversations.list )
    // pages routes
        app.get( "/"                , dashboard.get_render )
        app.get( "/conversation/*"  , conversation.get_render )
        app.get( "/download/*"      , conversation.download )
    // listen on 3000
        http.listen( 3000 , function() {
			debug( 'Server listen on ' + '3000' )
        })


