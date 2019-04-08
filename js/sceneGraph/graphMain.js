jsPlumb.ready(function(){
    // jsPlumb init code
    jsPlumb.draggable("node1");
    jsPlumb.draggable("node2");
    jsPlumb.draggable("node3");
    jsPlumb.draggable("node4");

    var endpointOptions = { isTarget:true, endpoint:"Rectangle", paintStyle:{ fill:"gray" } };
    var endpoint = jsPlumb.addEndpoint("node3", endpointOptions);
    
    jsPlumb.connect({
        source: "node1",
        target: "node2",
        endpoint: "Rectangle",
        connector: "StateMachine",
    });

    jsPlumb.connect({
        source: "node1",
        target: "node3",
        endpoint: "Rectangle",
        connector: "StateMachine",
    });

    jsPlumb.connect({
        source: "node2",
        target: "node4",
        endpoint: "Rectangle",
        connector: "StateMachine",
    });
});