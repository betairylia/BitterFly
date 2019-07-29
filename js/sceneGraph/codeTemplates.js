function SDFShape_template(name)
{
    return `// Code for ${name}
// Please do not change the function name and argument layouts.
SDFResult SDFShape_${name}( vec3 p )
{
    /* Output struct SDFResult: 
     *  float d = INF,       // distance 
     *  vec4  c = vec4(1.0), // surface color
     *  vec4  n = vec4(0.0), // surface normal; 
     *                          n.w == 0.0 => numerical normal will be used.
     */
    SDFResult res;

    // An sphere with radius 1.0, centered at (0, 0, 0)
    res.d = p - vec3(0.0) + 1.0f;
    
    // Compute surface shading when intersection
    if(d < _INTERSECT)
    {
        // "Bitterfly" color
        res.c = vec4(0.090, 0.082, 0.259, 1.0)
        res.n = normalize(p);
    }
    
    return res;
}
`;
}
