* czm_projection 投影矩阵
  * gl_Position = czm_projection * eyePosition
  
```js
czm_projection: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState) {
      return uniformState.projection;
    },
  })
```

* czm_modelView 视图矩阵

  * czm_modelView = czm_view * czm_model
  * eyePosition = czm_modelView * modelPosition
  
```js
czm_modelView: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState) {
      return uniformState.modelView;
    },
  })
```