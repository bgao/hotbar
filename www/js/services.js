
"use strict";

angular.module('hotbar.services', [])
  .factory('Util', [function() {
    //MD5 function - used for parsing emails for Gravatar images
    var MD5=function(s){function L(k,d){return(k<<d)|(k>>>(32-d))}function K(G,k){var I,d,F,H,x;F=(G&2147483648);H=(k&2147483648);I=(G&1073741824);d=(k&1073741824);x=(G&1073741823)+(k&1073741823);if(I&d){return(x^2147483648^F^H)}if(I|d){if(x&1073741824){return(x^3221225472^F^H)}else{return(x^1073741824^F^H)}}else{return(x^F^H)}}function r(d,F,k){return(d&F)|((~d)&k)}function q(d,F,k){return(d&k)|(F&(~k))}function p(d,F,k){return(d^F^k)}function n(d,F,k){return(F^(d|(~k)))}function u(G,F,aa,Z,k,H,I){G=K(G,K(K(r(F,aa,Z),k),I));return K(L(G,H),F)}function f(G,F,aa,Z,k,H,I){G=K(G,K(K(q(F,aa,Z),k),I));return K(L(G,H),F)}function D(G,F,aa,Z,k,H,I){G=K(G,K(K(p(F,aa,Z),k),I));return K(L(G,H),F)}function t(G,F,aa,Z,k,H,I){G=K(G,K(K(n(F,aa,Z),k),I));return K(L(G,H),F)}function e(G){var Z;var F=G.length;var x=F+8;var k=(x-(x%64))/64;var I=(k+1)*16;var aa=Array(I-1);var d=0;var H=0;while(H<F){Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=(aa[Z]|(G.charCodeAt(H)<<d));H++}Z=(H-(H%4))/4;d=(H%4)*8;aa[Z]=aa[Z]|(128<<d);aa[I-2]=F<<3;aa[I-1]=F>>>29;return aa}function B(x){var k="",F="",G,d;for(d=0;d<=3;d++){G=(x>>>(d*8))&255;F="0"+G.toString(16);k=k+F.substr(F.length-2,2)}return k}function J(k){k=k.replace(/rn/g,"n");var d="";for(var F=0;F<k.length;F++){var x=k.charCodeAt(F);if(x<128){d+=String.fromCharCode(x)}else{if((x>127)&&(x<2048)){d+=String.fromCharCode((x>>6)|192);d+=String.fromCharCode((x&63)|128)}else{d+=String.fromCharCode((x>>12)|224);d+=String.fromCharCode(((x>>6)&63)|128);d+=String.fromCharCode((x&63)|128)}}}return d}var C=Array();var P,h,E,v,g,Y,X,W,V;var S=7,Q=12,N=17,M=22;var A=5,z=9,y=14,w=20;var o=4,m=11,l=16,j=23;var U=6,T=10,R=15,O=21;s=J(s);C=e(s);Y=1732584193;X=4023233417;W=2562383102;V=271733878;for(P=0;P<C.length;P+=16){h=Y;E=X;v=W;g=V;Y=u(Y,X,W,V,C[P+0],S,3614090360);V=u(V,Y,X,W,C[P+1],Q,3905402710);W=u(W,V,Y,X,C[P+2],N,606105819);X=u(X,W,V,Y,C[P+3],M,3250441966);Y=u(Y,X,W,V,C[P+4],S,4118548399);V=u(V,Y,X,W,C[P+5],Q,1200080426);W=u(W,V,Y,X,C[P+6],N,2821735955);X=u(X,W,V,Y,C[P+7],M,4249261313);Y=u(Y,X,W,V,C[P+8],S,1770035416);V=u(V,Y,X,W,C[P+9],Q,2336552879);W=u(W,V,Y,X,C[P+10],N,4294925233);X=u(X,W,V,Y,C[P+11],M,2304563134);Y=u(Y,X,W,V,C[P+12],S,1804603682);V=u(V,Y,X,W,C[P+13],Q,4254626195);W=u(W,V,Y,X,C[P+14],N,2792965006);X=u(X,W,V,Y,C[P+15],M,1236535329);Y=f(Y,X,W,V,C[P+1],A,4129170786);V=f(V,Y,X,W,C[P+6],z,3225465664);W=f(W,V,Y,X,C[P+11],y,643717713);X=f(X,W,V,Y,C[P+0],w,3921069994);Y=f(Y,X,W,V,C[P+5],A,3593408605);V=f(V,Y,X,W,C[P+10],z,38016083);W=f(W,V,Y,X,C[P+15],y,3634488961);X=f(X,W,V,Y,C[P+4],w,3889429448);Y=f(Y,X,W,V,C[P+9],A,568446438);V=f(V,Y,X,W,C[P+14],z,3275163606);W=f(W,V,Y,X,C[P+3],y,4107603335);X=f(X,W,V,Y,C[P+8],w,1163531501);Y=f(Y,X,W,V,C[P+13],A,2850285829);V=f(V,Y,X,W,C[P+2],z,4243563512);W=f(W,V,Y,X,C[P+7],y,1735328473);X=f(X,W,V,Y,C[P+12],w,2368359562);Y=D(Y,X,W,V,C[P+5],o,4294588738);V=D(V,Y,X,W,C[P+8],m,2272392833);W=D(W,V,Y,X,C[P+11],l,1839030562);X=D(X,W,V,Y,C[P+14],j,4259657740);Y=D(Y,X,W,V,C[P+1],o,2763975236);V=D(V,Y,X,W,C[P+4],m,1272893353);W=D(W,V,Y,X,C[P+7],l,4139469664);X=D(X,W,V,Y,C[P+10],j,3200236656);Y=D(Y,X,W,V,C[P+13],o,681279174);V=D(V,Y,X,W,C[P+0],m,3936430074);W=D(W,V,Y,X,C[P+3],l,3572445317);X=D(X,W,V,Y,C[P+6],j,76029189);Y=D(Y,X,W,V,C[P+9],o,3654602809);V=D(V,Y,X,W,C[P+12],m,3873151461);W=D(W,V,Y,X,C[P+15],l,530742520);X=D(X,W,V,Y,C[P+2],j,3299628645);Y=t(Y,X,W,V,C[P+0],U,4096336452);V=t(V,Y,X,W,C[P+7],T,1126891415);W=t(W,V,Y,X,C[P+14],R,2878612391);X=t(X,W,V,Y,C[P+5],O,4237533241);Y=t(Y,X,W,V,C[P+12],U,1700485571);V=t(V,Y,X,W,C[P+3],T,2399980690);W=t(W,V,Y,X,C[P+10],R,4293915773);X=t(X,W,V,Y,C[P+1],O,2240044497);Y=t(Y,X,W,V,C[P+8],U,1873313359);V=t(V,Y,X,W,C[P+15],T,4264355552);W=t(W,V,Y,X,C[P+6],R,2734768916);X=t(X,W,V,Y,C[P+13],O,1309151649);Y=t(Y,X,W,V,C[P+4],U,4149444226);V=t(V,Y,X,W,C[P+11],T,3174756917);W=t(W,V,Y,X,C[P+2],R,718787259);X=t(X,W,V,Y,C[P+9],O,3951481745);Y=K(Y,h);X=K(X,E);W=K(W,v);V=K(V,g)}var i=B(Y)+B(X)+B(W)+B(V);return i.toLowerCase()};
    return {
      MD5: MD5
    };
  }])
  .factory('Global', [function() {
    // Initialization
    var _position = null;
    if (navigator.geolocation) {
      /* navigator.geolocation.watchPosition(function(pos) {
         _position = new google.maps.LatLng(pos.coords.latitude,
         pos.coords.longitude);
         }, function(err) {
         console.error("Watch device position error");
         console.error(err);
         }, { maximumAge: 60000, timeout: 5000, enableHighAccuracy:true }); */
      navigator.geolocation.getCurrentPosition(function(pos) {
        _position = new google.maps.LatLng(pos.coords.latitude,
                                           pos.coords.longitude);
      }, function(err) {
        console.error("Watch device position error");
        console.error(err);
      });
    }
    
    function set(key, value) {
      window[key] = value;
    }
    function get(key) {
      if (key === "client") {
        var client = null;
        if (window.user) {
          client = window.user._client;
        }
        if (!client) {
          var client_creds = {
            orgName: 'hotbar',
            appName: 'hotbar',
            logging: false // true
          };
          client = new Apigee.Client(client_creds);
        }
        return client;
      } else if (key === "position") {
        if (!_position) {
          _position = new google.maps.LatLng(42.358431, -71.059773);
        }
        
        return _position;
      } /* else if (key === "radius") {
        if (!window.radius) {
          window.radius = 1600; // 1 mile by default
        }
        return window.radius;
      } */ else {
        return window[key];
      }
    }
    function clearAll() {
      if (window.user && window.user._client)
        window.user._client.logout();
      window.user = null;
      window.position = null;
      window.activities = null;
    }
    return {
      clearAll: clearAll,
      get: get,
      set: set,
      demo: true,
      bar: "f03d4a00-ce79-11e3-a710-7f3db49e4552", // hacking
      accessToken: "YWMt3eB_eBKXEeSMB_dtoS-VGgAAAUeIjJOLEhqZ4oyXs_3r5CdYccTOKgFJ8l0"
    };
  }])
  .factory('S3', [function() {
    var s3URI = encodeURI("https://hotbar.s3.amazonaws.com/"),
    /* policyBase64 = "eyJleHBpcmF0aW9uIjoiMjAyMC0xMi0zMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoiaG90YmFyIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCIiXSx7ImFjbCI6InB1YmxpYy1yZWFkIn0sWyJzdGFydHMtd2l0aCIsIiRDb250ZW50LVR5cGUiLCIiXSxbImNvbnRlbnQtbGVuZ3RoLXJhbmdlIiwwLDUyNDI4ODAwMDAwMF1dfQ==", */
    policyBase64 = "eyJleHBpcmF0aW9uIjoiMjAyMC0xMi0zMVQxMjowMDowMC4wMDBaIiwiY29uZGl0aW9ucyI6W3siYnVja2V0IjoiaG90YmFyIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCIiXSx7ImFjbCI6InB1YmxpYy1yZWFkIn1dfQ==",
    /* signature = "BHDwJUlm+5/rtuVu8+EQc651dHo=", */
    signature = "hCTgnfYA3HEQRB0zLKMNL/pWTM0=",
    awsKey = "AKIAJW5SNHMAAMS4HUYA";
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
        /* var bucket = new AWS.S3({params: {Bucket: 'hotbar'}});
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
          if (err) {
            callback(err, null);
          } else {
            callback(null, data);
          }
        }); */

        // cordova FileTransfer
        var ft = new FileTransfer()
        , options = new FileUploadOptions();
        
        options.fileKey = "file";
        options.fileName = media.filename;
        options.mimeType = media.contentType;
        options.chunkedMode = false;
        options.params = {
          "key": media.filename,
          "AWSAccessKeyId": awsKey,
          "acl": "public-read",
          "policy": policyBase64,
          "signature": signature,
          "Content-Type": media.contentType
        };
        
        ft.upload(media.data, s3URI, function (e) {
          // deferred.resolve(e);
          console.log(e);
          callback(null, "uploaded");
        }, function (e) {
          // deferred.reject(e);
          console.log(e);
          callback("error", null);
        }, options);
      }
    }
  }])
  .factory('HotBars', ['Global', function(Global) {
    return {
      all: function(callback) {
        var _client = Global.get("client");
        var _user = Global.get("user");
        var radius = _user.get("radius") || 1600;
        var options = {
          client: _client,
          type: 'users',
          qs: { "ql": "location%20within%20" +
                radius + "%20of%20" +
                Global.get("position").lat() + "," +
                Global.get("position").lng() }
        };
        var hotbars = new Apigee.Collection(options);
        hotbars.fetch(function(err, data, entities) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, entities);
          }
        });
      },
      get: function(uuid, callback) {
        var _client = Global.get("client");
        var options = {
          type: 'users',
          uuid: uuid
        };
        if(_client) {
          _client.getEntity(options, function(err, data, entity) {
            if(err) callback(data, null);
            else callback(null, entity);
          });
        } else {
          callback("No client", null);
        }
      },
      getByName: function(name, callback) {
        var _client = Global.get("client");
        var options = {
          type: 'users',
          name: name
        };
        if(_client) {
          _client.getEntity(options, function(err, data, entity) {
            if(err) callback(data, null);
            else callback(null, entity);
          });
        } else {
          callback("No client", null);
        }
      },
      toggleFollow: function(bar, callback) {
        var _client = Global.get("client");
        var _user = Global.get("user");
        var options = {
          method: bar.following ? 'DELETE' : 'POST',
          endpoint: 'users/me/following/users/' + bar.uuid
        };
        _client.request(options, function(err, data) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, data);
          }
        });
      },
      getFollowers: function(bar, callback) {
        var _client = Global.get("client");
        var options = {
          client: _client,
          data: {
            type:'bars',
            uuid: bar.uuid
          }
        };
        
        var entity = new Apigee.Entity(options);
        entity.getFollowers(function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result.entities);
          }
        });
      }
    }
  }])
  .factory('Activities', ['$http', 'Global', function($http, Global) {
    return {
      all: function(callback) {
        var activities = Global.get("activities");
        var _client = Global.get("client");
        if (activities) {
          activities.resetPaging();
        } else {
          var options = {
            client: _client,
            type: 'activities',
            qs: { "ql": "order by created desc" }
          };
          activities = new Apigee.Collection(options);
          Global.set("activities", activities);
        }
        activities.fetch(function(err, data, entities) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, activities);
          }
        });
      },
      getOne: function(uuid, callback) {
        var _client = Global.get("client");
        if (_client) {
          var options = {
            client: _client,
            type: 'activities'
          };
          var activities = new Apigee.Collection(options);
          activities.getEntityByUUID(uuid, function(err, result) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, result.getEntity());
            }
          });
        } else {
          callback("No client", null);
        }
      },
      getByHotbar: function(hotbar, callback) {
        var _client = Global.get("client");
        if (_client) {
          var options = {
            client: _client,
            type: 'activities',
            qs: { "ql": "select * where hotbar = " +
                  hotbar.uuid }
          };
          var activities = new Apigee.Collection(options);
          activities.fetch(function(err, data, entities) {
            if (err) {
              callback(err, null);
            } else {
              callback(null, entities);
            }
          });
        } else {
          callback("No client", null);
        }
      },
      create: function(media, callback) {
        var _user = Global.get("user");
        var _client = Global.get("client");
        var options = {
          "actor": {
            "uuid": _user.get('uuid'),
            "username": _user.get('username'),
            "picture": _user.get('picture'),
            "email": _user.get('email')
          },
          "verb": "post",
          "object": media,
          "location": {
            "latitude": Global.get("position").lat() || null,
            "longitude": Global.get("position").lng() || null
          },
          "hotbar": media.hotbar.uuid
        };
        _client.createUserActivity('me', options, function(err, activity) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, activity);
          }
        });
      },
      toggleLike: function(activity, callback) {
        var _client = Global.get("client");
        var _user = Global.get("user");
        // create an Entity object that models the connecting entity
        var options1 = {
          client: _client,
          data: {
            type:'users',
            username: _user.get('username') || null
          }
        };
        var entity1 = new Apigee.Entity(options1);
        
        // create an Entity object that models the entity being connected to
        var options2 = {
          client: _client,
          data: {
            type:'activities',
            uuid: activity.uuid
          }
        };
        var entity2 = new Apigee.Entity(options2);
        
        // send the POST request
        var method = activity.liked ? "DELETE" : "POST";
        entity1.addOrRemoveConnection(method,"likes",entity2,function(err,result){
          if (err) { 
            callback(err, null);
	  } else { 
            callback(null, result);
	  }
        });
      },
      getLikes: function(activity, callback) {
        var _client = Global.get("client");
        var options = {
          client: _client,
          data: {
            type:'activities',
            uuid: activity.uuid
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
      submitComment: function(activity, callback) {
        var _user = Global.get("user");
        var _activities = Global.get("activities");
        if (_activities) {
          _activities.getEntityByUUID(activity.uuid,function(err,data,entity){
            if (err) {
              callback(err, null);
            } else {
              var object = {
                type: 'comment',
                content: activity.comment,
                location: {
                  latitude: Global.get("position").lat() || null,
                  longitude: Global.get("position").lng() || null
                },
                created: Date.now(),
                actor: {
                  // "displayName": _user.get('username'),
                  "uuid": _user.get('uuid'),
                  "username": _user.get('username'),
                  "picture": _user.get('picture'),
                  "email" : _user.get('email')
                }
              };
              var comments = entity.get("comments") || [];
              comments.push(object);
              entity.set("comments", comments);
              entity.save(function(error, result) {
                if (error) {
                  callback(error, null);
                } else {
                  callback(null, result);
                }
              });
            }  
          });
        }
      }
    }
  }])
  .factory('Users', ['Global', function(Global) {
    return {
      get: function(uuid, callback) {
        var _client = Global.get("client");
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
      login: function(email, password, callback) {
        var _client = Global.get("client");
        if (_client) {
          _client.login(email, password, function(err, data) {
            if (err) {
              callback(data, null);
            } else {
              _client.getLoggedInUser(function(err, data, user) {
                if (err) {
                  callback(err, null);
                } else {
                  if (_client.isLoggedIn()) {
                    Global.set("user",  user);
                    callback(null, user);
                  } else {
                    Global.set("user", null);
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
        var _client = Global.get("client");
        if (_client) {
          _client.logout();
        }
        Global.clearAll();
      },
      signup: function(username, password, email, name, callback) {
        var _client = Global.get("client");
        if (_client) {
          _client.signup(username, password, email, name,
                         function (err,data,entity) {
                           if (err) {
                             Global.set("user", null);
                             callback(err, null);
                           } else {
                             // Add new user to the free_memeber group
                             _client.setToken(Global.accessToken);
                             var groupOptions = {
                               client: _client,
                               path: "free_memeber"
                             }
                             var group = new Apigee.Group(groupOptions);
                             group.add( {user: entity}, function(err, data, entities) {
                               if (err) {
                                 Global.set("user", null);
                                 callback(err, null);
                               } else {
                                 _client.logout();
                                 _client.login(username, password, function(err, data){
                                   if (err) {
                                     Global.set("user", null);
                                     callback(err, null);
                                   } else {
                                     _client.getLoggedInUser(function(err,data,user){
                                       if (err) {
                                         Global.set("user", null);
                                         callback(err, null);
                                       } else {
                                         if (_client.isLoggedIn()) {
                                           Global.set("user", user);
                                           callback(null, user);
                                         } else {
                                           Global.set("user", null);
                                           callback(null, null);
                                         }
                                       }
                                     });
                                   }
                                 });
                               }
                             });
                           }
                         });
        } else {
          callback("no client", null);
        }
      },
      update: function(username, oldPass, newPass, email, name, callback) {
        var _client = Global.get("client");
        var _user = Global.get("user");
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
      getActivities: function(callback) {
        var _user = Global.get("user");
        var _client = Global.get("client");
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
      },
      // Currently we don't allow user follow users, but only user follow users,
      // so here when we get following, we only get hotbars.
      getFollowing: function(callback) {
        var _user = Global.get("user");
        var _client = Global.get("client");
        var options = {
          client: _client,
          data: {
            type: "users",
            uuid: _user.get("uuid")
          }
        };
        var user = new Apigee.Entity(options);
        user.getFollowing(function(err, result) {
          if (err) {
            callback(err, null);
          } else {
            callback(null, result.entities);
          }
        });
      }
    }
  }]);
