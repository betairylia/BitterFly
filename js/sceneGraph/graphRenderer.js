class CodeRenderer
{
    constructor(element)
    {
        this.container = element;
        this.editor = ace.edit(element.id);
        this.editor.setTheme("ace/theme/monokai");
        this.editor.session.setMode("ace/mode/glsl");
    }

    setCode(codeObj)
    {
        this.editor.setSession(codeObj.sess);
        // this.editor.getSession().setDocument(codeObj.doc);
        // this.editor.clearSelection();

        // this.editor.on("change", function(e){ codeObj.code = this.editor.getValue(); }.bind(this));
    }
}

class GraphRenderer
{
    constructor(element, codeRenderer)
    {
        this.container = element;
        this.codeRenderer = codeRenderer;
        this.plumb = jsPlumb.getInstance();

        this.plumb.setContainer(element.id);

        this.plumb.ready(function(){
            this.plumb.setZoom(1.0);
        }.bind(this));
    }
}

var codeRenderer = new CodeRenderer(document.getElementById('code-editor'));
var renderer = new GraphRenderer(document.getElementById('graphPanel'), codeRenderer);
var sceneGraph = new SceneGraph(renderer);

var cnt = 0;

function newNode(type)
{
    if(type == 'shape')
    {
        renderer.container.appendChild(document.createTextNode("!"));
    
        cnt += 1;
        node = new GraphNodeBase(`Shape-${cnt}`, 'shape', SDFShape_template);

        originalName = node.name;
        dupCount = 0;
        while(!sceneGraph.addNode(node))
        {
            dupCount += 1;
            node.name = originalName + `(${dupCount})`;
        }

        console.log(sceneGraph.generateJSON());
    }
}
