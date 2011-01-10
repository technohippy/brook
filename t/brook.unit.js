
Namespace()
.use('brook *')
.use('brook.util *')
.use('brook.lamda *')
.use('brook.channel *')
.use('brook.model *')
.apply(function(ns){

test('promise',function(){
    var exports = "promise wait mapper debug cond match filter lamda VERSION";
    expect( exports.split(/ /g).length);
    exports.split(/ /g).forEach(function(e){
        ok(ns[e],e);
    });
});

test('promise',function(){
    expect(3);
    var p = ns.promise(function(n,val){
        ok(true,'pass');
        n(val)
    }).bind(ns.mapper(ns.lamda("$*$")));
    
    p.bind(p).subscribe(function(val){
        ok( val == 10000 ,'val');
    },10);
});


test('promise defer',function(){
    expect(3);
    stop();
    var p = ns.promise(function(n,val){
        ok(true,'pass');
        n(val);
    }).bind(ns.mapper(ns.lamda("$*$"))).bind(ns.wait(100));
    p.bind(p).subscribe(function(val){;
        equal( val, 10000 ,'val');
        start();
    },10);
});

test('cond',function(){with(ns){
    expect(6);
    var p = promise().bind(
        cond(lamda('$ == 10'),promise(function(n,v){
            ok(true);
            equal( v,10);
            n(v)
        })),
        cond(lamda('$ % 2 ==0'),promise(function(n,v){
            ok( v%2 == 0);
            n(v)
        })),
        cond(lamda('$ == 11'),promise(function(n,v){
            ok(true);
            equal(v,11);
            n(v)
        }))
    );
    scatter().bind(p).run([10,11,12]);
}});

test('match',function(){with(ns){
    expect(4);
    var p = promise().bind(
        match({
            10 : ns.promise(function(n,v){ equal(v,10);n(v)}),
            11 : ns.promise(function(n,v){ equal(v,11);}),
            12 : ns.promise(function(n,v){ equal(v,12);})
        }).bind(function(n,v){
            equal(v,10);
        })
    );
    scatter().bind(p).run([10,11,12]);
}});

test('named channel',function(){
    expect(12);
    ns.observeChannel('test-channel',
        ns.promise(function(n,v){
            ok(n);
            equals( v.length , 3);
        }).bind(ns.debug())
    );
    ns.observeChannel('test-channel',
        ns.promise(function(n,v){
            ok(v);
            equals( v.length , 3);
        }).bind(ns.debug())
    );

    var l = ns.scatter()
    .bind( ns.mapper( ns.lamda('$*$')))
    .bind( ns.takeBy(3) )
    .bind( ns.sendChannel('test-channel'))

    l.run([1,2,3,4,5,6,7,8,9]);

});

test('channel',function(){
    expect(12);
    var channel = ns.createChannel();

    channel.observe( 
        ns.promise(function(n,v){
            ok(n);
            equals( v.length , 3);
        }).bind(ns.debug())
    );
    channel.observe(
        ns.promise(function(n,v){
            ok(v);
            equals( v.length , 3);
        }).bind(ns.debug())
    );

    var l = ns.scatter()
    .bind( ns.mapper( ns.lamda('$*$')))
    .bind( ns.takeBy(3) )
    .bind( channel.send())

    l.run([1,2,3,4,5,6,7,8,9]);
});


test('model',function(){
    expect(4);
    stop();
    var network = ns.wait(100).bind(function(n,v){
        n({ result : 'helloworld' ,args : v});
    });
    var view1 = ns.promise(function(n,v){
        equal( v.result , 'helloworld' );
        equal( v.args   , 20 );
    });
    var view2 = ns.promise(function(n,v){
        equal( v.result , 'helloworld' );
        equal( v.args   , 20 );
        start();
    });
    var model = ns.createModel();
    model.addMethod('create',
        ns.mapper(ns.lamda('$*2')).bind(
            network
        )
    );
    model.observe('create',view1);
    model.observe('create',view2);

    ns.promise().bind(model.notify('create')).run(10);
});



test('lock',function(){
    stop();
    var counter = 0;
    var inc = function(next,val){
        counter++;
        next(val);
    };
    var sync = ns.lock('test')
        .bind(ns.wait(10))
        .bind(inc,inc,inc)
        .bind(ns.wait(10))
        .bind(inc,inc,inc)
        .bind(function(n,v){ ok(counter%6==0);n(v)})
        .bind(ns.unlock('test'));

    var randWait = ns.scatter().bind( ns.wait( ns.lamda('Math.random()*400')));

    randWait.bind(sync).bind(ns.takeBy(6),function(n,v){
        start();
        n(v);
    }).run([1,2,3,4,5,6])

});


});



