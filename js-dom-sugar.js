/*
JS-DOM sugar
This library tries to accomplish two things:
1. Provide a lightweight jQuery like selector engine using pure JS, with optional specificity flags for added speed.
2. Extend native DOM objects with a simple interface similar to that familiar to jQuery users.

If this approach to extending the DOM makes you nervous, I would argue you need to check your assumptions.
With modern browsers we no longer live in the wild wild DOM west and should avail ourselves of Javascript's
object oriented features when we safely can. With proper code conventions we are in a position to avoid 95%
of the issues that have plagued prior attempts to extend native functionality.

Safety pre-cautions.
1. Only introducing one global variable for selecting elements, the $dom variable
2. Making our methods non-enumerable (using the interoperable ES5 Object.defineProperty method),
3. Properly namespacing our methods using the $ character before all dom extension methods,
4. Including proper error reporting when namespace collisions occur.

Some additional thoughts and rationales:
 A great library extending javascript (not DOM) natives: http://sugarjs.com/native
 More thoughts here: https://github.com/nbubna/mind-hacking/blob/gh-pages/extending-the-dom.md

*/


var $dom = (function(){

    /******************************************************************
     *                         Section 1
     * Methods on a globally available $dom object which holds lightweight methods for
     * querying the document. The main $dom function uses querySelectorAll but additional
     * methods on $dom allow you to select by classes, id, or tags;
     *
     ******************************************************************/

    //  We use regex for the performance gains on common use cases of simple classes and tags
    //  although the added regex does slightly degrade performance on more complex selectors.
    //  Performance stats: http://jsperf.com/regex-aided-queryselectorall

    //Invalid css class name characters: http://stackoverflow.com/questions/448981/what-characters-are-valid-in-css-class-selectors
    //Complete regex = /[\~\!\@\$\%\^\&\*\(\)\_\+\-\=\,\.\/\'\;\:\"\?\>\<\[\]\\\{\}\|\`\#]/g;
    var regex = /[~!$%^&|\*\(\)\+=,\.:\?><\[#]/g;  //Subset regex used

    var ret = function newQuerySelectorAll (querySelector){
        var selection, firstChar, isWindow;

        if((isWindow = querySelector === 'window') || querySelector === 'document'){
            //Return the nodeIt's inconsistent with the function API,
            return isWindow ? window : document;
        }

        var matches = querySelector.match(regex);
        if(matches && matches.length > 0){
            if(matches.length > 1){
                selection = document.querySelectorAll(querySelector)
            } else{
                firstChar = querySelector.charAt(0);
                if(firstChar === "."){
                    selection = document.getElementsByClassName(querySelector.slice(1))
                }
                //Note, it would seemingly make sense to have an id selector case, but the overhead required to convert
                //the selection into a HTMLCollection (rather than the single element returned by getElementById)
                //in order to maintain a consistent api, destroys any performance gains.
                else{
                    selection = document.querySelectorAll(querySelector)
                }
            }
        } else{
            selection = document.getElementsByTagName(querySelector);
        }

        return selection;
    };

    //Note, this method only returns a dom node, NOT a collection like the other methods
    ret.id = function (idSelector){
        return document.getElementById(idSelector);
    }

    ret.tag = function(tagSelector){
        return document.getElementsByTagName(tagSelector);
    }

    ret.class = function (classSelector){
        return document.getElementsByClassName(classSelector)
    }


    /******************************************************************
     *
     *                         Section 2
     *  jQuery like extensions to native DOM elements (Nodes and collections)
     *
     *******************************************************************

    /*
    * $find method on dom nodes
    * Also allows you to further the specificity of the selector engine
    *
    */
    extendNodePrototype("$find", function(querySelector){
        return this.querySelectorAll(querySelector)
    }, ['document', 'body']);

    //Convenience access to first node
    extendNodeCollectionPrototype("$find", function(){
        if(this.length > 1) console.error('You are calling a method meant for individual DOM nodes on an collection of nodes!');
        if(this.length === 0) console.error('You are trying to call a function on an empty DOM node collection!')
        return this[0].$find(arguments) || this;
    })

    /*extendNodePrototype("$find.id", $dom.id, ['document', 'body']);
    extendNodePrototype("$find.tag", $dom.tag, ['document', 'body']);
    extendNodePrototype("$find.class", $dom.class, ['document', 'body']);*/

    /* $remove: destroy dom nodes and collections */
    extendNodePrototype("$remove", function(){
        this.parentElement.removeChild(this);
    })

    extendNodeCollectionPrototype("$remove", function(){
        for(var i = 0, len = this.length; i < len; i++) {
            if(this[i] && this[i].parentNode) {
                this[i].parentNode.removeChild(this[i]);
            }
        }
    });

    /*
     *  $append method on DOM nodes
     */

    extendNodePrototype("$append", function(appendString){
        this.innerHTML += appendString;
        return this;
    }, ['body'])

    //Convenience access to first node
    extendNodeCollectionPrototype("$append", function(){
        if(this.length > 1) console.error('You are calling a method meant for individual DOM nodes on an collection of nodes!');
        if(this.length === 0) console.error('You are trying to call a function on an empty DOM node collection!')
        return this[0].$append(arguments) || this;
    })


    /*
     *  $prepend method on DOM nodes
     */

    extendNodePrototype("$prepend", function(prependString){
        var temp = this.innerHTML;
        this.innerHTML = prependString + temp;
        return this;
    }, ['body']);

    //Convenience access to first node
    extendNodeCollectionPrototype("$prepend", function(){
        if(this.length > 1) console.error('You are calling a method meant for individual DOM nodes on an collection of nodes!');
        if(this.length === 0) console.error('You are trying to call a function on an empty DOM node collection!')
        return this[0].$prepend(arguments) || this;
    })


    /*
     *  $empty method on DOM nodes
     */

    extendNodePrototype("$empty", function(){
        this.innerHTML = null;
        return this;
    }, ['body']);

    //Convenience access to first node
    extendNodeCollectionPrototype("$empty", function(){
        if(this.length > 1) console.error('You are calling a method meant for individual DOM nodes on an collection of nodes!');
        if(this.length === 0) console.error('You are trying to call a function on an empty DOM node collection!')
        return this[0].$empty(arguments) || this;
    });

    /*
     *  $css method on DOM nodes
     */
    extendNodePrototype("$css", function(keyOrObj, val){
            if(typeof keyOrObj === 'object'){
                for(var selector in keyOrObj){
                    this.style[selector] = keyOrObj[selector];
                }
                return this;
            } else if(val){
                this.style[keyOrObj] = val;
                return this;
            } else{
                return this.style[keyOrObj];
            }
        }, ['body']);

    extendNodeCollectionPrototype("$css", function(){
        if(this.length > 1) console.error('You are calling a method meant for individual DOM nodes on an collection of nodes!');
        if(this.length === 0) console.error('You are trying to call a function on an empty DOM node collection!')
        return this[0].$css(arguments) || this;
    });


    /*
     *  $forEach/$each method on DOM collections
     */

    extendNodeCollectionPrototype('$each', function(cb){
        var i, len;
        for(i = 0, len = this.length; i < len; i++){
            if(cb.call(this[i], i, this[i]) === false)
                break;
        }
    })



    /*
     *  $first() method on DOM collections
     */
    extendNodeCollectionPrototype(function(){
            return this[0] || this
        })


    /*
     *  $parent(querySelector) method on DOM collections
     */
    extendNodePrototype(function(querySelector){
        var parent = this.parentNode,
            matchesFn = this.matches || this.webkitMatchesSelector || this.mozMatchesSelector || this.msMatchesSelector,
            matchesFn = matchesFn.name;

        while(parent && !parent[matchesFn](querySelector))
            parent = this.parentNode;

        return parent;
    })


    //Todo $val()

    //Todo $addClass(), $removeClass(), $toggleClass(), $hasClass()
        //document.querySelector('.el').classList.add('class');
        //document.querySelector('.el').classList.remove('class');
        //document.querySelector('.el').classList.toggle('class');

    //Todo $children(selector)
        //this.children

    //Todo $clone();
        //document.querySelector('.el').cloneNode(true);
        //document.querySelector('.el').cloneNode(true);

    //Todo $attr()





    /******************************************************************
     *
     *                         Section 3
     *  Opinionated methods without analogues in jQuery that make a developer's life easier
     *
     *******************************************************************/

    /* $on: Event handler for element nodes and collections */

    var $onExtension = function(event, cb, useCapture){
        var idNum = 0;
        var self = this;
        var newCB = function (event){
            var calledEvent= new CustomEvent("$onCalled")
            self.dispatchEvent(calledEvent);
            cb.call(self, event);
        }

        self.addEventListener(event, newCB, useCapture);

        //Return object from binding event listener that you can use to turn it off.
        return {
            _id: idNum++,
            $off: function(){
                self.removeEventListener(event, newCB)
            },
            //Method usually called right after registering the event listener. Makes it so that the listener is deregistered after it has been called once.
            //Todo: split this into it's own method instead of on the return object to $on
            $once: function(){
                self.addEventListener('$onCalled', function $onCalledListener(){
                    self.removeEventListener(event, newCB)
                    self.removeEventListener("$onCalled", $onCalledListener)
                })
            }
        };
    }

    extendNodePrototype("$on", $onExtension, ['body', 'window', 'document']);
    extendNodePrototype("$bind", $onExtension, ['body', 'window', 'document']);

    var $onExtensionForCollections = function(event, cb, useCapture){
        for(var i = 0, len = this.length; i < len; i++) {
            this[i].$on(event, cb, useCapture);
        }
    }

    extendNodeCollectionPrototype("$on", $onExtensionForCollections);
    extendNodeCollectionPrototype("$bind", $onExtensionForCollections);


    /*
     $onEvents method - Completely custom method inspired by RxJS that lets you
     compose linear collections of events and execute an event listener at each step

     Usage:


    var mouseDragSubscription = $dom('#testid').$onEvents(['this => click', 'this.$parent("#dragBox") => mousemove', 'document => mouseup'],
        function(event){
            console.log(event.clientX, event.clientY);
        })


    $('#navigateAway').$on('click', function(){
        mouseDragSubscription.off();
     }).$once();
     */



    //TODO Test to ensure its working and make a way to deregister listeners
    extendNodePrototype("$onEvents", function(eventList, cb){
        var i, len, temp, firstElm, selectorEventPairs, firstPair, nextElm, listenerNumber;

        var groupListenerElm = document.createElement('div');

        for(i = 0, len = eventList.length; i < len; i++){
            temp = eventList[i].split("=>");
            if(temp[1]){
                selectorEventPairs.push([temp[0].trim(), temp[1].trim()])
            } else{
                selectorEventPairs.push(['this', temp[0].trim()]) //As a shorthand, users can omit a selector and it is assumed to be the element itself
            }
        }

        firstPair = selectorEventPairs[0];
        firstElm = eval(firstPair[0]);
        if(firstElm){



            var firstCB = function(someEvt1){
                listenerNumber = 0;
                //Now that the first listener has been triggered, lazy load all the other listeners
                for(i = 1, len = selectorEventPairs.length; i < len; i++){
                    nextElm = eval(selectorEventPairs[0]);

                    var nextCB = function(someEvt2){
                        if(i >= listenerNumber){//Ensure the event stream comes in the right order
                            listenerNumber = i;
                            cb.call(nextElm, someEvt2);
                        }
                    }

                    nextElm.$on(selectorEventPairs[i][1], nextCB)

                }
                cb.call(firstElm, someEvt1)
            }
            firstElm.$on(firstPair[1], firstCB)




        } else{
            console.error("The first element in the $onEvents chain does not exist");
        }
    })

    extendNodeCollectionPrototype('$onEvents', function(){
        var i, len;
        for(i = 0, len = this.length; i < len; i++){
            if(cb.call(this[i], i, this[i]) === false)
                break;
        }
    })


    /******************************************************************
     *
     *                         Section 4
     *  Internal helper functions and polyfills used internally
     *
     *******************************************************************/

    function safeDefineProperty(obj, propName, propValue){
        if(!(propName in obj)){
            Object.defineProperty(obj, propName, {
                value: propValue
            });
        } else{
            console.error( propName + " has already been defined on this object. The JS DOM sugar library may be incompatible with another library or a recent ECMA specification.")
        }
    }

    function extendNodePrototype(propName, propValue, extraElms){
        safeDefineProperty(Element.prototype, propName, propValue);
        if(extraElms){
            for(var i = 0; i < extraElms.length; i++){
                switch(extraElms[i]){
                    case 'window':
                        safeDefineProperty(Window.prototype, propName, propValue);
                        break;
                    case 'document':
                        safeDefineProperty(HTMLDocument.prototype, propName, propValue);
                        break;
                    case 'body':
                        safeDefineProperty(HTMLBodyElement.prototype, propName, propValue);
                        break;
                }

            }
        }

    }

    function extendNodeCollectionPrototype(propName, propValue){
        safeDefineProperty(HTMLCollection.prototype, propName, propValue);
        safeDefineProperty(NodeList.prototype, propName, propValue);
    }


    //CustomEvent for IE9 and IE10: https://developer.mozilla.org/en/docs/Web/API/CustomEvent
    function CustomEvent ( event, params ) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent( 'CustomEvent' );
        evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
        return evt;
    };

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;



    return ret;
})()
