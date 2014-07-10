angular.module('hotbar.services', [])
.factory('Util', [function() {
    /**
     *  The following code is used to display the posted dates as "x minutes ago, etc"
     *  instead of just a date.
     *
     *  Thank you John Resig and long live JQuery!
     *
     * JavaScript Pretty Date
     * Copyright (c) 2011 John Resig (ejohn.org)
     * Licensed under the MIT and GPL licenses.
     */

    // Takes a numeric date value (in seconds) and returns a string
    // representing how long ago the date represents.
    function prettyDate(createdDateValue) {
        var diff = (((new Date()).getTime() - createdDateValue) / 1000)
        var day_diff = Math.floor(diff / 86400);

        if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
            return 'just now';

        return fred = day_diff == 0 && (
            diff < 60 && "just now" ||
                diff < 120 && "1 minute ago" ||
                diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
                diff < 7200 && "1 hour ago" ||
                diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
            day_diff == 1 && "Yesterday" ||
            day_diff < 7 && day_diff + " days ago" ||
            day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
    }

    //MD5 function - used for parsing emails for Gravatar images
    var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
    return {
        prettyDate: prettyDate,
        MD5: MD5
    };
}])
.factory('Global', ['$log', function($log, localStorageService) {
    function clearAll() {
        window.user = null;
        window.position = null;
        window.client = null;
        window.allFeed = null;
    }
    function getUser() {
        return window.user;
    }
    function setUser(user) {
        window.user = user;
    }
    function getClient() {
        var client = window.client;
        if (!client) {
            var client_creds = {
                orgName: 'hotbar',
                appName: 'hotbar',
                logging: false // true
            };
            client = new window.Apigee.Client(client_creds);
            window.client = client;
        }
        return client;
    }
    function getPosition() {
        $log.debug( "Getting device position" );
        var position;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                position = new google.maps.LatLng(pos.coords.latitude,
                                                  pos.coords.longitude);
                window.position = position;
            });
        } else {
            position = window.position;
        }
        // hacking
        if (!position)
            position = new google.maps.LatLng(42.358431, -71.059773);
        return position;
    }
    function getAllFeed() {
        return window.allFeed;
    }
    function setAllFeed(allFeed) {
        window.allFeed = allFeed;
    }
    return {
        clearAll: clearAll,
        getUser: getUser,
        setUser: setUser,
        getClient: getClient,
        getPosition: getPosition,
        getAllFeed: getAllFeed,
        setAllFeed: setAllFeed,
        bar: "f03d4a00-ce79-11e3-a710-7f3db49e4552", // hacking
        radius: 5*1.6*1000 // 5 miles = 8000 meters
    };
}])
.factory('S3', [function() {
    var s3URI = encodeURI("https://hotbar.s3.amazonaws.com/"),
    policyBase64 = "eyJleHBpcmF0aW9uIjoiMjAyMC0xMi0zMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoiaG90YmFyIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCIiXSx7ImFjbCI6InB1YmxpYy1yZWFkIn0sWyJzdGFydHMtd2l0aCIsIiRDb250ZW50LVR5cGUiLCIiXSxbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwwLDUyNDI4ODAwMDAwMF1dfQ==";
    signature = "BHDwJUlm+5/rtuVu8+EQc651dHo=",
    awsKey = "AKIAJXSXYDINSCI7UD6Q",
    // AWS config
    AWS.config.credentials = {
        accessKeyId: "AKIAJW5SNHMAAMS4HUYA",
        secretAccessKey: "f1fHdPYHdedlyiO2XqSAsBDRBy9ieblb1RCf+LsD"
    };

    // Configure your region
    AWS.config.region = 'us-east-1';

    function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }
 
    return {
        all: function(callback) {
            var bucket = new AWS.S3({params: {Bucket: 'hotbar'}});
            bucket.listObjects(function(err, data) {
                if (err) { callback(err, null); }
                else { callback(null, data); }
            });
        },
        get: function(id, callback) {
            
        },
        put: function(media, callback) {
            var navigator = window.navigator;
            var bucket = new AWS.S3({params: {Bucket: 'hotbar'}});
            // var buf = dataURItoBlob(media.data.replace(/^data:image\/\w+;base64,/, ""));
            var buf = dataURItoBlob(media.data);
            // var buf = media.data;
            var params = {
                Key: media.filename, // required
                ACL: 'public-read',
                // ContentType: media.type,
                Body: buf
            };
            bucket.putObject(params, function(err, data) {
                if (err) callback(err, null);
                else {
                    // return the pre-signed URL
                    /* var param = { Bucket: 'hotbar',
                                   Key: media.filename,
                                   Expires: 60 };
                    AWS.S3.getSignedUrl('getObject', param, function(err,ulr) {
                        callback(null, url);
                    }); */
                    callback(null, data);
                }
            });

            // cordova FileTransfer
            /* var ft = new FileTransfer()
            , options = new FileUploadOptions();
            
            options.fileKey = "file";
            options.fileName = media.filename;
            options.mimeType = media.contentType;
            options.chunkedMode = false;
            options.params = {
                "key": fileName,
                "AWSAccessKeyId": awsKey,
                "acl": acl,
                "policy": policyBase64,
                "signature": signature,
                "Content-Type": media.contentType
            };
            
            ft.upload(media.data, s3URI,
                      function (e) {
                          deferred.resolve(e);
                      },
                      function (e) {
                          deferred.reject(e);
                      }, options);
            
            return deferred.promise();
            
            }*/
        }
    }
}])
.factory('Bars', ['Global', function(Global) {
    return {
        all: function(callback) {
            var _client = Global.getClient();
            if(_client) {
                var options = {
                    type: 'bars'
                    // qs: { "ql": "order by created desc" }
                };
                _client.createCollection(options, function(err, collectionObj) {
                    if (err) {
                        callback(err, null);
                    } else {
                        allBars = collectionObj;
                        allBars.resetPaging();
                        callback(null, allBars);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        get: function(uuid, callback) {
            var _client = Global.getClient();
            var options = {
                type: 'bars',
                uuid: uuid
            };
            if(_client) {
                _client.getEntity(options, function(err, entity, data) {
                    if(err) callback(entity, null);
                    else callback(null, entity._data);
                });
            } else {
                callback(null, null);
            }
        },
        getBar: function(position, callback) {
            
        },
        checkin: function(bar, callback) {
            var _client = Global.getClient();
            var _user = Global.getUser();
            // create an Entity object that models the connecting entity
            var connecting_entity_options = {
                client: _client,
                data: {
                    type:'users',
                    username: _user.get('username') || null
                }
            };
            var connecting_entity = new Apigee.Entity(connecting_entity_options);
            
            // create an Entity object that models the entity being connected to
            var connected_entity_options = {
                client: _client,
                data: {
                    type:'bars',
                    uuid: bar.uuid
                }
            };
            var connected_entity = new Apigee.Entity(connected_entity_options);
            
            // send the POST request
            connecting_entity.connect('checkin', connected_entity, function (err, result) {
                if (err) { 
                    callback(err, null);
	        } else { 
                    callback(null, result);
	        }
            });
        }
    }
}])
.factory('MediaFeed', ['$window', '$http', '$log', 'Global',
                       function($window, $http, $log, Global) {
    return {
        all: function(callback) {
            var allFeed = Global.getAllFeed();
            if (allFeed) {
                allFeed.fetch();
                allFeed.resetPaging();
                callback(null, allFeed);
                return;
            }
            var _client = Global.getClient();
            if(_client) {
                var options = {
                    type: 'activities',
                    qs: { "ql": "order by created desc" }
                };
                _client.createCollection(options, function(err, collectionObj) {
                    if (err) {
                        callback(err, null);
                    } else {
                        allFeed = collectionObj;
                        allFeed.resetPaging();
                        Global.setAllFeed(allFeed);
                        callback(null, allFeed);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        get: function(uuid, callback) {
            var _client = Global.getClient();
            var allMediaFeed = Global.getAllFeed();
            if (allMediaFeed) {
                allMediaFeed.getEntityByUUID(uuid, function(err, feed) {
                    if (err) callback(err, null);
                    else callback(null, feed);
                });
            } else {
                if (_client) {
                    var options = {
                        type: 'activities',
                        qs: { "ql": "order by created desc" }
                    };
                    _client.createCollection(options, function(err, data) {
                        if (err) {
                            callback(err, null);
                        } else {
                            Global.setAllFeed(data);
                            data.getEntityByUUID(uuid, function(err, feed) {
                                if (err) callback(err, null);
                                else callback(null, feed);
                            });
                        }
                    });
                } else {
                    callback(null, null);
                }
            }
        },
        create: function(media, callback) {
            var _user = Global.getUser();
            var _client = Global.getClient();
            media.type = "media";
            var options = {
                "actor": {
                    "displayName": _user.get('username'),
                    "uuid": _user.get('uuid'),
                    "username": _user.get('username'),
                    "image" : {
                        "duration" : 0,
                        "height" : 80,
                        "url" : "http://www.gravatar.com/avatar/",
                        "width" : 80
                    },
                    "email": _user.get('email')
                },
                "verb": "post",
                "object": media,
                "lat": Global.getPosition().lat() || null,
                "lon": Global.getPosition().lng() || null
            };
            _client.createUserActivity('me', options, function(err, activity) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, activity);
                }
            });
        },
        like: function(mediaFeed, callback) {
            var _client = Global.getClient();
            var _user = Global.getUser();
            // create an Entity object that models the connecting entity
            var connecting_entity_options = {
                client: _client,
                data: {
                    type:'users',
                    username: _user.get('username') || null
                }
            };
            var connecting_entity = new Apigee.Entity(connecting_entity_options);
            
            // create an Entity object that models the entity being connected to
            var connected_entity_options = {
                client: _client,
                data: {
                    type:'activities',
                    uuid: mediaFeed.uuid
                }
            };
            var connected_entity = new Apigee.Entity(connected_entity_options);
            
            // send the POST request
            connecting_entity.connect('likes', connected_entity, function (err, result) {
                if (err) { 
                    callback(err, null);
	        } else { 
                    callback(null, result);
	        }
            });
        },
        unlike: function(mediaFeed, callback) {
            var _client = Global.getClient();
            var _user = Global.getUser();
            // create an Entity object that models the connecting entity
            var connecting_entity_options = {
                client: _client,
                data: {
                    type:'users',
                    username: _user.get('username')
                }
            };
            var connecting_entity = new Apigee.Entity(connecting_entity_options);
            
            // create an Entity object that models the entity being connected to
            var connected_entity_options = {
                client: _client,
                data: {
                    type:'activities',
                    uuid: mediaFeed.uuid
                }
            };
            var connected_entity = new Apigee.Entity(connected_entity_options);
            
            // send the POST request
            connecting_entity.disconnect('likes', connected_entity, function (err, result) {
                if (err) { 
                    callback(err, null);
	        } else { 
                    callback(null, result);
	        }
            });
        },
        getLikes: function(mediaFeed, callback) {
            var _client = Global.getClient();
            var options = {
                client: _client,
                data: {
                    type:'activities',
                    uuid: mediaFeed.uuid
                }
            };
            
            var entity = new Apigee.Entity(options);
            
            // the connection type you want to retrieve
            var relationship = 'connecting'; // 'likes';
            
            // initiate the GET request
            entity.getConnections(relationship, function (error, result) {
	        if (error) { 
                    callback(error, null);
	        } else { 
                    callback(error, result.entities);
	        }
            });
        },
        submitComment: function(mediaFeed, callback) {
            var _user = Global.getUser();
            var _client = Global.getClient();
            var object = {
                type: "comment",
                media: mediaFeed.uuid,
                comment: mediaFeed.comment
            };
            if (mediaFeed && mediaFeed.comment) {
                var options = {
                    "actor": {
                        "displayName": _user.get('username'),
                        "uuid": _user.get('uuid'),
                        "username": _user.get('username'),
                        "image" : {
                            "duration" : 0,
                            "height" : 80,
                            "url" : "http://www.gravatar.com/avatar/",
                            "width" : 80
                        },
                        "email" : _user.get('email'),
                        // "picture": "fred"
                    },
                    "verb": "post",
                    "object": object,
                    "lat": Global.getPosition().lat() || null,
                    "lon": Global.getPosition().lng() || null
                };
                _client.createUserActivity('me', options, function(err, activity) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, activity);
                    }
                });
            }
        }
    }
}])
.factory('Users', ['Global', function(Global) {
    return {
        get: function(uuid, callback) {
            var _client = Global.getClient();
            var options = {
                'type': 'users',
                'uuid': uuid
            };
            if (_client) {
                _client.getEntity(options, function(err, user, data) {
                    if(err) {
                        callback(user, null);
                    } else {
                        callback(null, user);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        login: function(username, password, callback) {
            var _client = Global.getClient();
            if (_client) {
                _client.login(username, password, function(err, data) {
                    if (err) {
                        callback(data, null);
                    } else {
                        _client.getLoggedInUser(function(err, data, user) {
                            if (err) {
                                callback(err, null);
                            } else {
                                if (_client.isLoggedIn()) {
                                    Global.setUser( user );
                                    callback(null, user);
                                } else {
                                    Global.setUser(null);
                                    callback(null, null);
                                }
                            }
                        });
                    }
                });
            } else {
                callback(null, null);
            }
        },
        logout: function() {
            var _client = Global.getClient();
            if (_client) {
                _client.logout();
            }
            Global.clearAll();
        },
        signup: function(username, password, email, name, callback) {
            var _client = Global.getClient();
            if (_client) {
                _client.signup(username, password, email, name, function (err, user) {
                    if (err) {
                        Global.setUser(null);
                        callback(user, null);
                    } else {
                        Global.setUser(user);
                        callback(null, user);
                    }
                });
            } else {
                callback(null, null);
            }
        },
        update: function(username, oldPass, newPass, email, name, callback) {
            var _client = Global.getClient();
            var _user = Global.getUser();
            if (_client && _user) {
                _user.set({ "name": name, "username": username, "email": email,
                            "oldpassword": oldPass, "newpassword": newPass });
                _user.save(function(err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            } else {
                callback("not logged in");
            }
        },
        getActivityFeed: function(callback) {
            var _user = Global.getUser();
            var _client = Global.getClient();
            if (_client && _user) {
                _client.getFeedForUser(_user.get('username'),
                    function(err, data, entities) {
                    if (err) {
                        callback(err, null);
                    } else {
                        callback(null, entities);
                    }
                });
            } else {
                callback("not logged in", null);
            }
        }
    }
}]);
