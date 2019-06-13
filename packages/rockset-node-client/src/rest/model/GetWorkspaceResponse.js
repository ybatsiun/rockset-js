(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['ApiClient', 'model/Workspace'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    module.exports = factory(require('../ApiClient'), require('./Workspace'));
  } else {
    // Browser globals (root is window)
    if (!root.RestApi) {
      root.RestApi = {};
    }
    root.RestApi.GetWorkspaceResponse = factory(root.RestApi.ApiClient, root.RestApi.Workspace);
  }
}(this, function(ApiClient, Workspace) {
    'use strict';




  /**
   * The GetWorkspaceResponse model module.
   * @module model/GetWorkspaceResponse
   * @version v1
   */

  /**
   * Constructs a new <code>GetWorkspaceResponse</code>.
   * @alias module:model/GetWorkspaceResponse
   * @class
   */
  var exports = function() {
    var _this = this;


  };

  /**
   * Constructs a <code>GetWorkspaceResponse</code> from a plain JavaScript object, optionally creating a new instance.
   * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
   * @param {Object} data The plain JavaScript object bearing properties of interest.
   * @param {module:model/GetWorkspaceResponse} obj Optional instance to populate.
   * @return {module:model/GetWorkspaceResponse} The populated <code>GetWorkspaceResponse</code> instance.
   */
  exports.constructFromObject = function(data, obj) {
    if (data) {
      obj = obj || new exports();

      if (data.hasOwnProperty('data')) {
        obj['data'] = Workspace.constructFromObject(data['data']);
      }
    }
    return obj;
  }

  /**
   * the workspace that was requested
   * @member {module:model/Workspace} data
   */
  exports.prototype['data'] = undefined;



  return exports;
}));

