class CodeObject
{
    constructor(name, codeInit)
    {
        var ace_doc = ace.require('ace/document');
        var ace_ses = ace.require('ace/edit_session').EditSession;

        this.name = name;
        
        var code = "";
        if(!codeInit)
        {
            codeInit = function(n){ return `// Code for ${n}`; }
        }
        if(typeof codeInit === 'function')
        {
            code = codeInit(this.safeName);
        }
        else
        {
            code = codeInit;
        }
        
        this.doc = new ace_doc.Document(code);
        this.sess = new ace_ses(this.doc, "ace/mode/glsl");
        this.sess.setUseWrapMode(true);
    }

    get code()
    {
        return this.doc.getValue();
    }

    set code(code)
    {
        this.doc.setValue(code);
    }

    get name()
    {
        return this._name;
    }

    get safeName()
    {
        return this._safeName;
    }

    set name(name)
    {
        this._name = name;
        this._safeName = name.replace(/[^a-zA-Z0-9]/g,'_');
    }
}

class GraphNodeBase extends CodeObject
{
    constructor(name, type, codeInit, pos = [100, 100])
    {
        super(name, codeInit);
        this.name = name;
        this.type = type;
        this.pos = pos;

        this.epIn = [];
        this.epOut = [];

        this.edgeIn = [];
        this.edgeOut = [];
    }

    init(graph)
    {
        // TODO: sth like dtor here before "ctor"

        this.graph = graph;
        this.renderer = graph.renderer;
        this.plumb = this.renderer.plumb;

        this.DOMElement = document.querySelector('#graphNodeTemplate').content.firstElementChild.cloneNode(true);
        this.renderer.container.appendChild(this.DOMElement);

        this.DOMElement.addEventListener('click', this.onSelection.bind(this)); // TODO: -> graph.select(this);

        this.DOMElement.id = `sgNode-${this.name}`;
        this.DOMElement.style.left = this.pos[0] + 'px';
        this.DOMElement.style.top = this.pos[1] + 'px';

        this.DOMElement.querySelector('.header').innerHTML = this.name;

        var children = this.DOMElement.children;
        for (var i = 0; i < children.length; i++)
        {
            var _id = children[i].id;
            children[i].id = `sgNode-${this.name}-${_id}`;
        }

        // Init jsPlumb
        this.plumb.draggable(this.DOMElement.id);

        var endpointIn  = this.plumb.addEndpoint(`sgNode-${this.name}-nodeInput`, {isTarget: true, anchor: "Left"});
        var endpointOut = this.plumb.addEndpoint(`sgNode-${this.name}-nodeOutput`, {isSource: true, anchor: "Right"});

        this.addEpIn(endpointIn);
        this.addEpOut(endpointOut);
    }

    addEpIn(ep)
    {
        ep.parentNode = this;
        ep.parentNodeEpIdx = this.epIn.length;
        this.epIn.push(ep);
    }

    addEpOut(ep)
    {
        ep.parentNode = this;
        ep.parentNodeEpIdx = this.epOut.length;
        this.epOut.push(ep);
    }

    addNodeIn(node, idx)
    {
        this.edgeIn.push([node, idx]);
    }

    removeNodeIn(node, idx)
    {
        this.edgeIn = this.edgeIn.filter((item) => {return !(item[0] == node && item[1] == idx)});
    }

    addNodeOut(node, idx)
    {
        this.edgeOut.push([node, idx]);
    }

    removeNodeOut(node, idx)
    {
        this.edgeOut = this.edgeOut.filter((item) => {return !(item[0] == node && item[1] == idx)});
    }

    onSelection()
    {
        this.renderer.codeRenderer.setCode(this);
    }
}

class SceneGraph
{
    constructor(renderer, autoLoad = true, autoSaveInterval = 10000)
    {
        this.renderer = renderer;
        renderer.graph = this;
        this.nodeList = [];

        this.isDirty = true;

        this.plumb = renderer.plumb;
        this.plumb.bind("connection", this.onPlumbConnect.bind(this));
        this.plumb.bind("connectionDetached", this.onPlumbDisconnect.bind(this));

        if(autoLoad)
        {
            var jsonString = localStorage.getItem("bitterFly_autoSaveJSON");
            if(jsonString)
            {
                this.loadJSON(jsonString);
            }
        }

        if(autoSaveInterval > 0)
        {
            this.autoSaveInterval = autoSaveInterval;
            this.autoSaveTimer();
        }
    }

    onPlumbConnect(info)
    {
        console.log(info);
        
        var src = info.sourceEndpoint.parentNode;
        var dst = info.targetEndpoint.parentNode;
        var srcIdx = info.sourceEndpoint.parentNodeEpIdx;
        var dstIdx = info.targetEndpoint.parentNodeEpIdx;

        this.connect(src, srcIdx, dst, dstIdx);
    }

    onPlumbDisconnect(info)
    {
        console.log(info);

        var src = info.sourceEndpoint.parentNode;
        var dst = info.targetEndpoint.parentNode;
        var srcIdx = info.sourceEndpoint.parentNodeEpIdx;
        var dstIdx = info.targetEndpoint.parentNodeEpIdx;

        this.disconnect(src, srcIdx, dst, dstIdx);
    }

    connect(src, srcIdx, dst, dstIdx)
    {
        src.addNodeOut(dst, dstIdx);
        dst.addNodeIn(src, srcIdx);
    }

    disconnect(src, srcIdx, dst, dstIdx)
    {
        src.removeNodeOut(dst, dstIdx);
        dst.removeNodeIn(src, srcIdx);
    }

    addNode(node)
    {
        // Check if there are any duplicated (safe) names
        for(var i = 0; i < this.nodeList.length; i++)
        {
            if(this.nodeList[i].safeName == node.safeName)
            {
                return false;
            }
        }

        this.nodeList.push(node);
        node.init(this);
        return true;
    }

    generateJSON()
    {
        var jsonObj = [];
        var nodeIdx = {};
        for(var i = 0; i < this.nodeList.length; i++)
        {
            nodeIdx[this.nodeList[i].safeName] = i;
        }

        for(var i = 0; i < this.nodeList.length; i++)
        {
            var obj = {};
            obj['name'] = this.nodeList[i].name;
            obj['type'] = this.nodeList[i].type;
            obj['code'] = this.nodeList[i].code;
            
            obj['in'] = [];
            for(var ii = 0; ii < this.nodeList[i].edgeIn.length; ii++)
            {
                if(this.nodeList[i].edgeIn[ii])
                {
                    obj['in'].push([nodeIdx[this.nodeList[i].edgeIn[ii][0].safeName], this.nodeList[i].edgeIn[ii][1]]);
                }
                else
                {
                    obj['in'].push([-1, -1]);
                }
            }

            obj['out'] = [];
            for(var ii = 0; ii < this.nodeList[i].edgeOut.length; ii++)
            {
                if(this.nodeList[i].edgeOut[ii])
                {
                    obj['out'].push([nodeIdx[this.nodeList[i].edgeOut[ii][0].safeName], this.nodeList[i].edgeOut[ii][1]]);
                }
                else
                {
                    obj['out'].push([-1, -1]);
                }
            }

            obj['pos'] = [this.nodeList[i].DOMElement.offsetLeft, this.nodeList[i].DOMElement.offsetTop];

            jsonObj.push(obj);
        }

        return JSON.stringify(jsonObj);
    }

    save()
    {
        // TODO: save
        this.isDirty = false;
    }

    autoSave()
    {
        localStorage.setItem("bitterFly_autoSaveJSON", this.generateJSON());
    }

    autoSaveTimer()
    {
        this.autoSave();
        setTimeout(this.autoSaveTimer.bind(this), this.autoSaveInterval);
    }

    loadJSON(json, forced = true)
    {
        if(forced || !(this.isDirty))
        {
            // TODO: read json
            // TODO: clean all nodes (current will not trigger GC?)
            this.nodeList = [];

            var jsonObj = JSON.parse(json);

            for(var i = 0; i < jsonObj.length; i++)
            {
                this.addNode(new GraphNodeBase(jsonObj[i].name, jsonObj[i].type, jsonObj[i].code, jsonObj[i].pos));
            }

            for(var i = 0; i < jsonObj.length; i++)
            {
                // var inputs  = [];
                // var outputs = [];

                // TODO: create corresponding endpoints

                for(var j = 0; j < jsonObj[i].in.length; j++)
                {
                    // inputs.push([this.nodeList[jsonObj[i].in[j][0]], jsonObj[i].in[j][1]]);
                    this.plumb.connect({
                        source: this.nodeList[jsonObj[i].in[j][0]].epOut[jsonObj[i].in[j][1]],
                        target: this.nodeList[i].epIn[j],
                    });
                }

                // for(var j = 0; j < jsonObj[i].out.length; j++)
                // {
                //     outputs.push([this.nodeList[jsonObj[i].out[j][0]], jsonObj[i].out[j][1]]);
                // }

                // this.nodeList[i].loadInput(inputs);
                // this.nodeList[i].loadOutput(outputs);
            }
        }
        else
        {
            alert('Current status unsaved!');
        }
    }
}
