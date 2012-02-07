/*!
 * musdash.js - Stupidly quick logic-less {{mustache}} templates for JavaScript
 * Some code borrowed from: http://github.com/janl/mustache.js
 */

var Musdash = (typeof module !== "undefined" && module.exports) || {};

(function (exports) {

    exports.name = "musdash.js";
    exports.version = "0.1.0-dev";
    exports.compile = compile;
    
    var escapeMap = {
        "&" : "&amp;",
        "<": "&lt;",
            ">" : "&gt;",
        '"' : '&quot;',
        "'" : '&#39;'
    };
            
    var defaults = {
        open: '{{',
        close: '}}'
    };
    
    function proc( code, name, inverted )
    {
        this.code = code;
        this.name = name;
        this.inverted = inverted;

        this.parse = function( view )
        {
            return this._render( [
                view
            ] );
        }

        this._dorender = function( scope )
        {
            var t = true;
            var a = 1;
            var l = this.code.length;
            var res = this.code[0];

            for( ; a < l; a++ )
            {
                if( t )
                 {
                    if( this.code[a] != null )
                        res += this.code[a]._render( scope );
                 }
                else
                {
                    res += this.code[a];
                }

                t = !t;
            }

            return res;
        }

        this._render = function( stack )
        {
            var stack;
            
            if( this.name != undefined )
            {
                for( var a = 0; a < stack.length; a++ )
                {
                    if( stack[a][this.name] != undefined )
                    {
                        stack.unshift( stack[a][this.name] );
                        break;
                    }
                }
            }

            var current = stack[0];

            if( typeof current == "function" )
            {
                stack.shift();

                return current( this._dorender( stack ) );
            }
            else if( current instanceof Array )
            {
                var res = "";
                var count = current.length;

                stack.shift();
                                
                if( count == 0 )
                {
                    if( !this.inverted ) return "";

                    return this._dorender( stack );
                }
                else
                {
                    if( this.inverted ) return "";

                    for( var a = 0; a < count; a++ )
                    {
                        stack.unshift( current[a] );
                        res += this._dorender( stack );
                        stack.shift();
                    }
                }

                return res;
            }
            else
            {
                return this._dorender( stack );
            }
        }
    }

    function value( name, escape )
    {
        this.name = name;
        this.escape = escape;

        this._render = function( stack )
        {
            var val = this._findSymbol( stack, this.name );

            if( val == null ) return "";

            if( typeof val == "function" )
                return val.apply( stack[0], [] );
            else return this.escape ? escapeHTML( val ) : val;
        }

        this._findSymbol = function( stack, symbol )
        {
            if( symbol == '.' ) return stack[0];

            var names = symbol.split( '.' );
            var names_count = names.length;

            for( var a = 0; a < stack.length; a++ )
            {
                var t = stack[a];

                for( var b = 0; b < names_count; b++ )
                {
                    t = t[names[b]];

                    if( t == undefined ) break;
                }

                if( t != undefined ) return t;
            }

            return null;
        }
    }

    function escapeHTML( string )
    {
        return string.replace( /&<>"'/g, function( s )
        {
            return escapeMap[s] || s;
        } );
    }

    function compile( template, options )
    {
        var opts = {};
        for( var attr in defaults )
            opts[ attr ] = defaults[ attr ];
        for( var attr in options )
            opts[ attr ] = options[ attr ];
        
        var parts = template.split( opts.open );
        var l = parts.length;
        var a = 1;
        var i = 1;
        
        var scope = {
        code : [
            parts[0]
        ],
        parent : null,
        name : null,
        inverted : false
        };

        for( ; a < l; a++ )
        {
            tmp = parts[a].split( opts.close );
            part1 = tmp[0];
            part2 = tmp[1];

            if( part1[0] == '#' )
            {
                scope = { code : [], parent : scope, name : part1.substring( 1 ), inverted : false };
            }
            else if( part1[0] == '^' )
            {
                scope = { code : [], parent : scope, name : part1.substring( 1 ), inverted : true };
            }
            else if( part1[0] == '/' )
            {                
                if( '/' + scope.name != part1 ) throw new Error( "Expecting `/" + scope.name + "` not `" + part1 + "`" );
                scope.parent.code.push( new proc( scope.code, scope.name, scope.inverted ) );
                scope = scope.parent;
            }
            else if( part1[0] == '!' )
            {
                scope.code.push( null );
            }
            else if( part1[0] == '&' )
            {
                scope.code.push( new value( part1.substring( 1 ), false ) );
            }
            else
            {
                scope.code.push( new value( part1, true ) );
            }

            scope.code.push( part2 );
        }

        if( scope.parent != null ) throw new Error( "`" + scope.name + "` was left open" );

        
        return new proc( scope.code );
    }
    
})(Musdash)